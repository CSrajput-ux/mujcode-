import { Search, Download, Filter } from 'lucide-react';
import { Button } from '../ui/button';

interface FilterBarProps {
    onSearchChange: (val: string) => void;
    onDownload: () => void;
}

export default function FilterBar({ onSearchChange, onDownload }: FilterBarProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Filters Group */}
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <select className="border rounded-md px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[#FF7A00] outline-none">
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>

                <select className="border rounded-md px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[#FF7A00] outline-none">
                    <option value="">All Branches</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                </select>

                <select className="border rounded-md px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[#FF7A00] outline-none">
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                </select>

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
                <Button onClick={onDownload} className="bg-[#FF7A00] hover:bg-[#FF6A00] flex items-center gap-2 h-10 min-w-[170px] justify-center">
                    <Download className="w-4 h-4" />
                    Download Report
                </Button>
            </div>
        </div>
    );
}
