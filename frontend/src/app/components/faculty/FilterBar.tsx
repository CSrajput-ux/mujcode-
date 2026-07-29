import { useState } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { useFacultyAssignments } from '@/app/hooks/useFacultyAssignments';

interface FilterBarProps {
    onSearchChange: (val: string) => void;
    onDownload: () => void;
    onSectionChange?: (val: string) => void;
    onSubjectChange?: (val: string) => void;
}

export default function FilterBar({
    onSearchChange,
    onDownload,
    onSectionChange,
    onSubjectChange,
}: FilterBarProps) {
    const { sections, subjectsBySection } = useFacultyAssignments();
    const [selectedSection, setSelectedSection] = useState('');

    // ✅ Section choose karo → subjects auto-load
    const availableSubjects = subjectsBySection(selectedSection);

    const handleSectionChange = (section: string) => {
        setSelectedSection(section);
        onSectionChange?.(section);
        onSubjectChange?.(''); // reset subject when section changes
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Filters Group */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">

                {/* Section Filter */}
                <select
                    className="border rounded-md px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[#FF7A00] outline-none"
                    value={selectedSection}
                    onChange={(e) => handleSectionChange(e.target.value)}
                >
                    <option value="">All Sections</option>
                    {sections.map(s => (
                        <option key={s} value={s}>Section {s}</option>
                    ))}
                </select>

                {/* Subject Filter — auto from section */}
                <select
                    className="border rounded-md px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[#FF7A00] outline-none disabled:opacity-50"
                    disabled={!selectedSection}
                    onChange={(e) => onSubjectChange?.(e.target.value)}
                >
                    <option value="">
                        {!selectedSection ? 'Select Section first' : 'All Subjects'}
                    </option>
                    {availableSubjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search test..."
                        className="pl-9 pr-4 py-2 border rounded-md text-sm w-full md:w-64 focus:ring-2 focus:ring-[#FF7A00] outline-none"
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full md:w-auto justify-end">
                <Button variant="outline" className="flex items-center gap-2 h-10">
                    <Filter className="w-4 h-4" />
                    More Filters
                </Button>
                <Button onClick={onDownload} className="bg-[#FF7A00] hover:bg-[#FF6A00] flex items-center gap-2 h-10 min-w-[160px] justify-center">
                    <Download className="w-4 h-4" />
                    Download Report
                </Button>
            </div>
        </div>
    );
}
