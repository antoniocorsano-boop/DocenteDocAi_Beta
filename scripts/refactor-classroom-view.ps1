# Script to refactor ClassroomView.tsx for Sprint E
$f = "c:\Users\anton\DocenteDocAI\DocenteDocAi\src\components\ClassroomView.tsx"
$lines = Get-Content $f

# === Build new import line (line 1, index 0) ===
$newLine1 = "import React, { useState, useMemo } from 'react';"
$newLine2 = "import { Studente, MaterialeDidattico, KnowledgeBaseEntry, ClassroomViewProps, HomeworkStatus, ParticipationEntry } from '../types';"
$newLine2b = "import { ClassroomRegisterTab, StudentStat } from './classroom/ClassroomRegisterTab';"
$newLine2c = "import { ClassroomNotesTab } from './classroom/ClassroomNotesTab';"
$newLine2d = "import { ClassroomResourcesTab } from './classroom/ClassroomResourcesTab';"

# === New register tab component call ===
$registerTab = @(
    "                {activeTab === 'register' && (",
    "                    <ClassroomRegisterTab",
    "                        lesson={lesson}",
    "                        studentStats={studentStats}",
    "                        studentAttendance={studentAttendance}",
    "                        homeworkCheck={homeworkCheck}",
    "                        participation={participation}",
    "                        checkedObjectives={checkedObjectives}",
    "                        onAttendanceToggle={handleAttendanceToggle}",
    "                        onObjectiveCheck={handleObjectiveCheck}",
    "                        onSelectStudentForActions={setSelectedStudentForActions}",
    "                        onViewStudentProfile={setViewingStudentProfile}",
    "                    />",
    "                )}"
)

# === New notes tab component call ===
$notesTab = @(
    "                {activeTab === 'notes' && (",
    "                    <ClassroomNotesTab",
    "                        notes={draftEntry.notes || ''}",
    "                        onNotesChange={(text) => onUpdateDraftEntry(draftKey, { notes: text })}",
    "                        onVoiceAppend={(text) => onUpdateDraftEntry(draftKey, { notes: (draftEntry.notes ? draftEntry.notes + String.fromCharCode(10) : '') + text })}",
    "                        onCopy={() => setIsCopyModalOpen(true)}",
    "                        onShare={() => setIsShareInfoOpen(true)}",
    "                        onPrintHomework={handlePrintHomework}",
    "                    />",
    "                )}"
)

# === New resources tab component call ===
$resTab = @(
    "                {activeTab === 'resources' && (",
    "                    <ClassroomResourcesTab",
    "                        lesson={lesson}",
    "                        onPreviewMaterial={handlePreviewMaterial}",
    "                    />",
    "                )}"
)

# --- Find key line indices (0-based) ---
# import line 1: index 0
# import line 2: index 1
# focusedStudentIndex: index 50
# studentGridRef: index 51
# "Reset focus": index 149
# handlePrintHomework: index 188
# register tab start: index 299 (line 300)
# notes tab start: index 500 (line 501)
# tools tab start: index 592 (line 593)
# resources tab start: index 598 (line 599)
# closing div after resources: ???

# Find exact indices dynamically
$idxFocused = ($lines | Select-String "focusedStudentIndex.*useState").LineNumber[0] - 1
$idxGridRef = ($lines | Select-String "studentGridRef.*useRef").LineNumber[0] - 1
$idxResetFocus = ($lines | Select-String "// Reset focus").LineNumber[0] - 1
$idxPrintHW = ($lines | Select-String "handlePrintHomework").LineNumber[0] - 1
$idxRegister = ($lines | Select-String "activeTab === .register. &&").LineNumber[0] - 1
$idxNotes = ($lines | Select-String "activeTab === .notes. &&").LineNumber[0] - 1
$idxTools = ($lines | Select-String "activeTab === .tools. &&").LineNumber[0] - 1
$idxRes = ($lines | Select-String "activeTab === .resources. &&").LineNumber[0] - 1
# Find closing )} after resources (line after resources block ends)
# Resources block ends before FAB div
$idxFab = ($lines | Select-String "position.*fixed.*bottom").LineNumber[0] - 1

Write-Host "focused=$($idxFocused+1) gridRef=$($idxGridRef+1) resetFocus=$($idxResetFocus+1) printHW=$($idxPrintHW+1)"
Write-Host "register=$($idxRegister+1) notes=$($idxNotes+1) tools=$($idxTools+1) res=$($idxRes+1) fab=$($idxFab+1)"

# Find end of resources tab (the )} before the closing wrapper div)
# It's either idxFab - 3 or idxFab - 2, let's find the last )} before FAB
$idxResEnd = $idxFab - 1
while ($idxResEnd -gt $idxRes -and $lines[$idxResEnd].Trim() -eq '') { $idxResEnd-- }
# idxResEnd should now be at the closing )} of resources tab

Write-Host "resEnd=$($idxResEnd+1)"

# === Build new studentStats line (typed with StudentStat) ===
# Replace "const studentStats = useMemo(() => {" with typed version
# This is a single line replacement, we'll just fix the type annotation

# === Assemble new file ===
$newLines = @()
# 1: New import lines
$newLines += $newLine1
$newLines += $newLine2
$newLines += $newLine2b
$newLines += $newLine2c
$newLines += $newLine2d
# 2: Lines 3..idxFocused-1 (0-indexed: 2..idxFocused-1)
$newLines += $lines[2..($idxFocused-1)]
# 3: Skip idxFocused and idxGridRef (focusedStudentIndex + studentGridRef)
# 4: Lines after gridRef to idxResetFocus-1
$newLines += $lines[($idxGridRef+1)..($idxResetFocus-1)]
# 5: Skip idxResetFocus..idxPrintHW-1 (useEffect + handleStudentGridKeyDown)
# 6: Lines from idxPrintHW..idxRegister-1 (handlePrintHomework + return header)
$newLines += $lines[$idxPrintHW..($idxRegister-1)]
# 7: New register tab
$newLines += $registerTab
# 8: Empty line + skip old register tab (lines idxRegister+1..idxNotes-1 are old register content + empty)
$newLines += ''
# 9: New notes tab
$newLines += $notesTab
# 10: Empty line
$newLines += ''
# 11: Skip old notes tab (idxNotes..idxTools-1), keep tools tab (idxTools..idxRes-1)
$newLines += $lines[$idxTools..($idxRes-1)]
# 12: New resources tab
$newLines += $resTab
# 13: Keep remaining lines after old resources tab (idxResEnd+1 to end)
$newLines += $lines[($idxResEnd+1)..($lines.Length-1)]

Write-Host "New file lines: $($newLines.Length)"
[System.IO.File]::WriteAllLines($f, $newLines, [System.Text.Encoding]::UTF8)
Write-Host "Done."
