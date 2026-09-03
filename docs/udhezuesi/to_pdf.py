# -*- coding: utf-8 -*-
"""
Export the .docx to PDF through Word.

Word rather than a converter, for one reason: the table of contents is a FIELD, empty
until something computes it. Word repaginates, fills the field in with real page numbers,
and only then exports — so the PDF ships with a usable contents page instead of a
placeholder. It also means the PDF matches exactly what staff see when they open the .docx.

Run:  python to_pdf.py
"""
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
DOCX = os.path.join(HERE, 'Udhezues-Perdorimi-Paneli-Administrues.docx')
PDF = os.path.splitext(DOCX)[0] + '.pdf'

# wdExportFormatPDF = 17; wdDoNotSaveChanges = 0
PS = r'''
$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open('%s', $false, $true)
    # Fill in the TOC and the page-number fields, then repaginate so the numbers are real.
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Fields.Update() | Out-Null
    $doc.Repaginate()
    $doc.ExportAsFixedFormat('%s', 17)
    Write-Output ('pages=' + $doc.ComputeStatistics(2))
    $doc.Close(0)
} finally {
    $word.Quit()
}
''' % (DOCX.replace('/', '\\'), PDF.replace('/', '\\'))

result = subprocess.run(['powershell', '-NoProfile', '-Command', PS],
                        capture_output=True, text=True)
print(result.stdout.strip() or result.stderr.strip()[:400])
print('  %s -> %s' % (os.path.basename(DOCX), os.path.basename(PDF)))
