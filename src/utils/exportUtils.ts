import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Race, Category, Runner, TimingEvent, RaceResult, RaceStatistics, RacePackageBackup } from '../types';
import { formatElapsedTime } from './timeUtils';

// Generate Results CSV string
export function generateResultsCSV(race: Race, results: RaceResult[]): string {
  const headers = [
    'Overall Rank',
    'Category Rank',
    'Gender Rank',
    'Bib',
    'First Name',
    'Last Name',
    'Gender',
    'Age',
    'Category',
    'Team/Club',
    'Gun Time',
    'Net Time',
    'Pace (/km)',
    'Pace (/mi)',
    'Gap',
    'Status',
  ];

  const escapeCsv = (str: string | number | null | undefined) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = results.map((r) => [
    r.rank > 0 ? r.rank : 'DNF',
    r.categoryRank > 0 ? r.categoryRank : '-',
    r.genderRank > 0 ? r.genderRank : '-',
    r.bibNumber,
    r.firstName,
    r.lastName,
    r.gender,
    r.age ?? '',
    r.categoryName,
    r.team,
    r.formattedGunTime,
    r.formattedNetTime,
    r.formattedPaceMinKm,
    r.formattedPaceMinMile,
    r.formattedGap,
    r.status.toUpperCase(),
  ]);

  const csvContent = [
    `# Race: ${race.name}`,
    `# Distance: ${race.distanceLabel} (${race.distanceMeters}m)`,
    `# Date: ${race.date}`,
    `# Location: ${race.location || 'N/A'}`,
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');

  return csvContent;
}

// Generate Runner Registration Template CSV
export function generateRunnersTemplateCSV(): string {
  const headers = ['Bib', 'First Name', 'Last Name', 'Gender (M/F/X)', 'Age', 'Category Code', 'Team/Club', 'Emergency Contact', 'Emergency Phone'];
  const samples = [
    ['101', 'John', 'Doe', 'M', '29', 'M_OPEN', 'City Runners', 'Jane Doe', '555-0101'],
    ['102', 'Alice', 'Smith', 'F', '34', 'F_OPEN', 'Harbor Athletics', 'Bob Smith', '555-0102'],
    ['103', 'Sam', 'Taylor', 'X', '42', 'OPEN', 'Trailblazers', 'Pat Taylor', '555-0103'],
  ];

  return [headers.join(','), ...samples.map((row) => row.join(','))].join('\n');
}

// Parse Runner Import CSV
export function parseRunnersCSV(
  csvText: string,
  raceId: string,
  categories: Category[]
): { runners: Partial<Runner>[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.startsWith('#'));
  if (lines.length < 2) {
    return { runners: [], errors: ['CSV file is empty or missing data rows.'] };
  }

  const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const bibIdx = rawHeaders.findIndex((h) => h.includes('bib') || h.includes('number'));
  const firstIdx = rawHeaders.findIndex((h) => h.includes('first') || h.includes('name'));
  const lastIdx = rawHeaders.findIndex((h) => h.includes('last'));
  const genderIdx = rawHeaders.findIndex((h) => h.includes('gender') || h.includes('sex'));
  const ageIdx = rawHeaders.findIndex((h) => h.includes('age'));
  const catIdx = rawHeaders.findIndex((h) => h.includes('cat') || h.includes('group'));
  const teamIdx = rawHeaders.findIndex((h) => h.includes('team') || h.includes('club'));
  const emNameIdx = rawHeaders.findIndex((h) => h.includes('contact') || h.includes('emergency'));
  const emPhoneIdx = rawHeaders.findIndex((h) => h.includes('phone'));

  const parsed: Partial<Runner>[] = [];
  const errors: string[] = [];
  const defaultCatId = categories[0]?.id || '';

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const bib = bibIdx >= 0 ? row[bibIdx] : row[0];
    if (!bib) {
      errors.push(`Row ${i + 1}: Missing bib number.`);
      continue;
    }

    const firstName = firstIdx >= 0 ? row[firstIdx] : row[1] || `Runner ${bib}`;
    const lastName = lastIdx >= 0 ? row[lastIdx] : row[2] || '';
    const genderRaw = (genderIdx >= 0 ? row[genderIdx] : 'U').toUpperCase();
    const gender = (['M', 'F', 'X', 'U'].includes(genderRaw) ? genderRaw : 'U') as any;
    const age = ageIdx >= 0 && !isNaN(parseInt(row[ageIdx], 10)) ? parseInt(row[ageIdx], 10) : null;

    let categoryId = defaultCatId;
    if (catIdx >= 0 && row[catIdx]) {
      const catCode = row[catIdx].toLowerCase();
      const matched = categories.find(
        (c) => c.code.toLowerCase() === catCode || c.name.toLowerCase() === catCode
      );
      if (matched) categoryId = matched.id;
    }

    const team = teamIdx >= 0 ? row[teamIdx] : '';
    const emergencyContactName = emNameIdx >= 0 ? row[emNameIdx] : '';
    const emergencyContactPhone = emPhoneIdx >= 0 ? row[emPhoneIdx] : '';

    parsed.push({
      raceId,
      bibNumber: bib,
      firstName,
      lastName,
      gender,
      age,
      categoryId,
      team,
      status: 'registered',
      wave: 1,
      emergencyContactName,
      emergencyContactPhone,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    });
  }

  return { runners: parsed, errors };
}

// Generate Beautiful HTML Printable Race Report & Results
export function generateRaceHTMLReport(
  race: Race,
  results: RaceResult[],
  categories: Category[],
  stats: RaceStatistics
): string {
  const dateFormatted = new Date(race.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const top3Overall = results.slice(0, 3);

  const categoryGroups = categories.map((cat) => {
    const catResults = results.filter((r) => r.categoryId === cat.id);
    return {
      category: cat,
      results: catResults,
      podium: catResults.slice(0, 3),
    };
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${race.name} - Official Race Results</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      margin: 0;
      padding: 0;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 3px solid #10B981;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .race-title {
      font-size: 26px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 6px 0;
    }
    .race-meta {
      font-size: 14px;
      color: #64748B;
      margin: 0;
    }
    .badge-dist {
      background: #10B981;
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 16px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 14px;
      text-align: center;
    }
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
    }
    .stat-label {
      font-size: 11px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
      margin: 24px 0 12px 0;
      border-left: 4px solid #3B82F6;
      padding-left: 10px;
    }
    .podium-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .podium-box {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      background: #FFFFFF;
    }
    .podium-1 { border-top: 4px solid #F59E0B; background: #FFFBEB; }
    .podium-2 { border-top: 4px solid #94A3B8; background: #F8FAFC; }
    .podium-3 { border-top: 4px solid #D97706; background: #FFFDF5; }
    .podium-place { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    .podium-name { font-size: 15px; font-weight: 700; color: #0F172A; }
    .podium-time { font-size: 14px; font-weight: 600; color: #10B981; margin-top: 4px; }
    .podium-cat { font-size: 12px; color: #64748B; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th {
      background: #0F172A;
      color: #FFFFFF;
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #E2E8F0;
    }
    tr:nth-child(even) {
      background-color: #F8FAFC;
    }
    .rank-cell { font-weight: 700; color: #0F172A; }
    .time-cell { font-weight: 700; font-family: monospace; color: #0F172A; }
    .cat-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      color: white;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="race-title">${race.name}</h1>
      <p class="race-meta">📅 ${dateFormatted} &nbsp;|&nbsp; 📍 ${race.location || 'Official Course'} &nbsp;|&nbsp; ⏱ Gun Start: ${race.startTimeMs ? new Date(race.startTimeMs).toLocaleTimeString() : 'N/A'}</p>
    </div>
    <div>
      <span class="badge-dist">${race.distanceLabel}</span>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.totalRegistered}</div>
      <div class="stat-label">Registered</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.finishers}</div>
      <div class="stat-label">Finishers (${stats.finishRatePercentage}%)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.fastestTimeMs ? formatElapsedTime(stats.fastestTimeMs) : '--:--'}</div>
      <div class="stat-label">Fastest Time</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.averageTimeMs ? formatElapsedTime(stats.averageTimeMs) : '--:--'}</div>
      <div class="stat-label">Average Time</div>
    </div>
  </div>

  ${
    top3Overall.length > 0
      ? `
  <div class="section-title">🏆 Overall Winners Podium</div>
  <div class="podium-container">
    ${
      top3Overall[0]
        ? `
    <div class="podium-box podium-1">
      <div class="podium-place">🥇 1st Place</div>
      <div class="podium-name">${top3Overall[0].fullName} (#${top3Overall[0].bibNumber})</div>
      <div class="podium-time">${top3Overall[0].formattedGunTime}</div>
      <div class="podium-cat">${top3Overall[0].categoryName} ${top3Overall[0].team ? '• ' + top3Overall[0].team : ''}</div>
    </div>`
        : ''
    }
    ${
      top3Overall[1]
        ? `
    <div class="podium-box podium-2">
      <div class="podium-place">🥈 2nd Place</div>
      <div class="podium-name">${top3Overall[1].fullName} (#${top3Overall[1].bibNumber})</div>
      <div class="podium-time">${top3Overall[1].formattedGunTime} (${top3Overall[1].formattedGap})</div>
      <div class="podium-cat">${top3Overall[1].categoryName} ${top3Overall[1].team ? '• ' + top3Overall[1].team : ''}</div>
    </div>`
        : ''
    }
    ${
      top3Overall[2]
        ? `
    <div class="podium-box podium-3">
      <div class="podium-place">🥉 3rd Place</div>
      <div class="podium-name">${top3Overall[2].fullName} (#${top3Overall[2].bibNumber})</div>
      <div class="podium-time">${top3Overall[2].formattedGunTime} (${top3Overall[2].formattedGap})</div>
      <div class="podium-cat">${top3Overall[2].categoryName} ${top3Overall[2].team ? '• ' + top3Overall[2].team : ''}</div>
    </div>`
        : ''
    }
  </div>`
      : ''
  }

  <div class="section-title">📊 Overall Official Standings</div>
  <table>
    <thead>
      <tr>
        <th style="width: 45px;">Rank</th>
        <th style="width: 55px;">Bib</th>
        <th>Runner Name</th>
        <th style="width: 40px;">G/A</th>
        <th>Category</th>
        <th>Team / Club</th>
        <th style="text-align: right;">Gun Time</th>
        <th style="text-align: right;">Pace /km</th>
        <th style="text-align: right;">Gap</th>
      </tr>
    </thead>
    <tbody>
      ${results
        .map(
          (r) => `
        <tr>
          <td class="rank-cell">${r.rank > 0 ? r.rank : 'DNF'}</td>
          <td><b>#${r.bibNumber}</b></td>
          <td><b>${r.fullName}</b></td>
          <td>${r.gender}${r.age ? ' ' + r.age : ''}</td>
          <td><span class="cat-badge" style="background: ${r.categoryColor};">${r.categoryName}</span></td>
          <td>${r.team || '-'}</td>
          <td class="time-cell" style="text-align: right;">${r.formattedGunTime}</td>
          <td style="text-align: right; color: #64748B;">${r.formattedPaceMinKm}</td>
          <td style="text-align: right; color: #64748B;">${r.formattedGap}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="section-title">🎖 Category Top Finishers</div>
  ${categoryGroups
    .map(
      (cg) => `
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 8px 0; font-size: 14px; color: ${cg.category.color};">● ${cg.category.name} (${cg.results.length} runners)</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">Cat Rank</th>
            <th style="width: 55px;">Bib</th>
            <th>Name</th>
            <th>Overall Rank</th>
            <th style="text-align: right;">Gun Time</th>
            <th style="text-align: right;">Net Time</th>
          </tr>
        </thead>
        <tbody>
          ${
            cg.results.length > 0
              ? cg.results
                  .map(
                    (cr) => `
            <tr>
              <td class="rank-cell">${cr.categoryRank === 1 ? '🥇 1' : cr.categoryRank === 2 ? '🥈 2' : cr.categoryRank === 3 ? '🥉 3' : cr.categoryRank}</td>
              <td><b>#${cr.bibNumber}</b></td>
              <td><b>${cr.fullName}</b> ${cr.team ? ' <small>(' + cr.team + ')</small>' : ''}</td>
              <td>${cr.rank}</td>
              <td class="time-cell" style="text-align: right;">${cr.formattedGunTime}</td>
              <td class="time-cell" style="text-align: right;">${cr.formattedNetTime}</td>
            </tr>`
                  )
                  .join('')
              : '<tr><td colspan="6" style="text-align: center; color: #94A3B8;">No finishers yet in this category.</td></tr>'
          }
        </tbody>
      </table>
    </div>`
    )
    .join('')}

  <div class="footer">
    <div>Generated by Quick Community Race Timer</div>
    <div>Official Offline Results • Verified</div>
  </div>
</body>
</html>
  `;
}

// Print or Save PDF
export async function printOrSharePDF(
  race: Race,
  results: RaceResult[],
  categories: Category[],
  stats: RaceStatistics
): Promise<void> {
  const html = generateRaceHTMLReport(race, results, categories, stats);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => printWin.print(), 250);
      }
    }
    return;
  }

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${race.name} - Results PDF`,
      });
    }
  } catch (error) {
    console.warn('PDF Print/Share Error:', error);
  }
}

// Export CSV File
export async function exportAndShareCSV(race: Race, results: RaceResult[]): Promise<void> {
  const csv = generateResultsCSV(race, results);
  const fileName = `${race.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    return;
  }

  try {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Share ${race.name} Results CSV`,
      });
    }
  } catch (error) {
    console.warn('CSV Share Error:', error);
  }
}
