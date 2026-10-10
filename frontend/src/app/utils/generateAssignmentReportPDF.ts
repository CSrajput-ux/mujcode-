import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Assignment, Submission } from '../services/facultyAssignmentService';

interface ReportOptions {
    assignment: Assignment;
    submissions: Submission[];
    facultyName?: string;
}

export function generateAssignmentReportPDF({ assignment, submissions, facultyName }: ReportOptions): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ── 1. Top Decorative Brand Bar ──────────────────────────────────────────
    doc.setFillColor(255, 122, 0); // MUJ Orange #FF7A00
    doc.rect(0, 0, pageWidth, 4, 'F');

    // ── 2. Institution & Document Header ──────────────────────────────────────
    doc.setTextColor(15, 23, 42); // Navy #0F172A
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MANIPAL UNIVERSITY JAIPUR', pageWidth / 2, 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // #475569
    doc.text('School of Computer Science & Engineering • Academic Evaluation Portal', pageWidth / 2, 19, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 122, 0);
    doc.text('STUDENT EVALUATION & SUBMISSIONS REPORT', pageWidth / 2, 26, { align: 'center' });

    // Decorative Separator
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.setLineWidth(0.5);
    doc.line(14, 29, pageWidth - 14, 29);

    // ── 3. Assignment & Course Metadata Box ────────────────────────────────────
    const boxX = 14;
    const boxY = 32;
    const boxWidth = pageWidth - 28;
    const boxHeight = 32;

    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.setDrawColor(203, 213, 225); // #CBD5E1
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');

    // Left Column details
    const leftColX = boxX + 4;
    const rightColX = boxX + boxWidth / 2 + 4;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);

    // Row 1
    doc.text('Assignment Title:', leftColX, boxY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(assignment.title || 'N/A', leftColX + 32, boxY + 7, { maxWidth: boxWidth / 2 - 38 });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Subject:', rightColX, boxY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(assignment.subject || 'N/A', rightColX + 26, boxY + 7, { maxWidth: boxWidth / 2 - 32 });

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Branch / Section:', leftColX, boxY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${assignment.branch || 'CSE'} - Section ${assignment.section || 'All'}`, leftColX + 32, boxY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Faculty Name:', rightColX, boxY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(facultyName || 'Faculty Instructor', rightColX + 26, boxY + 15);

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Total Marks:', leftColX, boxY + 23);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 122, 0);
    doc.text(`${assignment.totalMarks || 30} Marks`, leftColX + 32, boxY + 23);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Generated On:', rightColX, boxY + 23);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    doc.text(dateStr, rightColX + 26, boxY + 23);

    // ── 4. Summary Metrics Strip ───────────────────────────────────────────────
    const statsY = boxY + boxHeight + 4;
    const totalSubs = submissions.length;
    const gradedSubs = submissions.filter((s) => s.status === 'Graded');
    const gradedCount = gradedSubs.length;
    const pendingCount = submissions.filter((s) => s.status === 'Submitted').length;
    const avgMarks =
        gradedCount > 0
            ? (
                  gradedSubs.reduce((acc, curr) => acc + (curr.marks ?? curr.score ?? 0), 0) / gradedCount
              ).toFixed(1)
            : '-';

    const statBoxes = [
        { label: 'Total Submissions', value: String(totalSubs) },
        { label: 'Evaluated / Graded', value: String(gradedCount) },
        { label: 'Pending Review', value: String(pendingCount) },
        { label: 'Avg Evaluated Score', value: avgMarks !== '-' ? `${avgMarks} / ${assignment.totalMarks || 30}` : '-' },
    ];

    const statBoxWidth = (boxWidth - 9) / 4;
    statBoxes.forEach((item, idx) => {
        const sx = boxX + idx * (statBoxWidth + 3);
        doc.setFillColor(241, 245, 249); // #F1F5F9
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(sx, statsY, statBoxWidth, 12, 1.5, 1.5, 'FD');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139); // #64748B
        doc.text(item.label, sx + statBoxWidth / 2, statsY + 4.5, { align: 'center' });

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(item.value, sx + statBoxWidth / 2, statsY + 9.5, { align: 'center' });
    });

    // ── 5. Student Submissions AutoTable ───────────────────────────────────────
    const tableStartY = statsY + 16;

    const tableRows = submissions.map((sub, index) => {
        const sNo = String(index + 1);
        const regNo = sub.regNo || sub.registrationNumber || sub.college_id || sub.rollNumber || '-';
        const name = sub.studentName || 'Student';
        const status = sub.status || 'Submitted';
        const submittedTime = sub.submittedAt
            ? new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : sub.submittedOn || '-';

        const marks =
            sub.status === 'Graded' && sub.marks !== undefined
                ? `${sub.marks} / ${assignment.totalMarks || 30}`
                : '-';

        const fileList =
            Array.isArray(sub.files) && sub.files.length > 0
                ? sub.files
                : sub.fileUrl
                ? [sub.fileUrl]
                : [];
        const fileName = sub.fileName || (fileList.length > 0 ? 'Document.pdf' : 'None');
        const feedback = sub.feedback || '-';

        return [sNo, regNo, name, status, submittedTime, marks, fileName, feedback];
    });

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Reg No', 'Student Name', 'Status', 'Submitted At', 'Marks Awarded', 'File Name', 'Faculty Feedback']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
            fillColor: [15, 23, 42], // Dark Navy #0F172A
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'center',
            cellPadding: 2.5,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
            cellPadding: 2.5,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 8 }, // #
            1: { halign: 'center', fontStyle: 'bold', cellWidth: 26 }, // Reg No
            2: { cellWidth: 32 }, // Student Name
            3: { halign: 'center', cellWidth: 18 }, // Status
            4: { halign: 'center', cellWidth: 28 }, // Submitted At
            5: { halign: 'center', fontStyle: 'bold', cellWidth: 20 }, // Marks
            6: { cellWidth: 26 }, // File Name
            7: { cellWidth: 'auto' }, // Feedback
        },
        didParseCell: (data) => {
            // Highlight Status column
            if (data.section === 'body' && data.column.index === 3) {
                if (data.cell.raw === 'Graded') {
                    data.cell.styles.textColor = [22, 101, 52]; // Green
                    data.cell.styles.fontStyle = 'bold';
                } else {
                    data.cell.styles.textColor = [29, 78, 216]; // Blue
                }
            }
            // Highlight Marks column
            if (data.section === 'body' && data.column.index === 5) {
                if (data.cell.raw !== '-') {
                    data.cell.styles.textColor = [22, 101, 52]; // Green
                }
            }
        },
        margin: { left: 14, right: 14, bottom: 20 },
        didDrawPage: (data) => {
            // Footer on every page
            const pageNum = doc.getNumberOfPages();
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184); // #94A3B8

            // Top footer rule
            doc.setDrawColor(226, 232, 240);
            doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

            // Left footer note
            doc.text(
                'Confidential Academic Record • Manipal University Jaipur (MujCode)',
                14,
                pageHeight - 7
            );

            // Right footer page number
            doc.text(
                `Page ${data.pageNumber} of ${pageNum}`,
                pageWidth - 14,
                pageHeight - 7,
                { align: 'right' }
            );
        },
    });

    // ── 6. Faculty Signature Block on Last Page ────────────────────────────────
    const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 40;
    const signatureY = Math.min(finalY + 14, pageHeight - 25);

    if (signatureY < pageHeight - 18) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('Faculty Signature: ___________________________', pageWidth - 80, signatureY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${facultyName || 'Faculty Instructor'}`, pageWidth - 80, signatureY + 5);
    }

    // ── 7. Save / Trigger Download ─────────────────────────────────────────────
    const sanitizedTitle = (assignment.title || 'Assignment_Report')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40);
    const fileName = `MUJ_Report_${sanitizedTitle}.pdf`;

    doc.save(fileName);
}
