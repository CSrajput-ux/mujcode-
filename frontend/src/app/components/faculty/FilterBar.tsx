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
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-gray-100 mb-5 flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Filters Group */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">

                {/* Section Filter */}
                <select
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-[#FF7A00] outline-none h-9"
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
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-[#FF7A00] outline-none disabled:opacity-50 h-9"
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
                        className="pl-9 pr-3.5 py-1.5 border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-[#FF7A00] outline-none h-9"
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 w-full md:w-auto justify-end">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-9 text-xs sm:text-sm font-semibold px-3.5">
                    <Filter className="w-4 h-4" />
                    More Filters
                </Button>
                <Button size="sm" onClick={onDownload} className="bg-[#FF7A00] hover:bg-[#FF6A00] flex items-center gap-2 h-9 text-xs sm:text-sm font-semibold min-w-[140px] justify-center px-4">
                    <Download className="w-4 h-4" />
                    Download Report
                </Button>
            </div>
        </div>
    );
}
