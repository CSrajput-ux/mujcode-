import { useState, useEffect, useCallback } from 'react';
import {
    List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
    Clock, Save, Bold, Italic, Heading1, Heading2, Heading3, Code, Minus,
    CheckCircle2, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { cn } from './ui/utils';

const lowlight = createLowlight(common);

// --- Types ---
interface CaseStudyNotebookProps {
    open: boolean;
    onClose: () => void;
    caseStudyTitle: string;
}

interface TOCItem {
    id: string;
    text: string;
    level: number;
}

// --- MenuBar Component ---
const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const addImage = () => {
        const url = window.prompt('URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const ToolbarButton = ({ onClick, isActive, children, title }: any) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            title={title}
            className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center hover:bg-gray-100",
                isActive ? "bg-orange-50 text-[#FF7A00] shadow-sm" : "text-gray-500 hover:text-gray-900"
            )}
        >
            {children}
        </button>
    );

    return (
        <div className="flex items-center flex-wrap gap-1 px-4 py-2 bg-white border-b border-gray-100 sticky top-0 z-10">
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
            >
                <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
            >
                <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
            >
                <Heading3 className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
            >
                <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Ordered List"
            >
                <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                title="Code Block"
            >
                <Code className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={setLink}
                isActive={editor.isActive('link')}
                title="Insert Link"
            >
                <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={addImage}
                title="Insert Image"
            >
                <ImageIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Divider"
            >
                <Minus className="w-4 h-4" />
            </ToolbarButton>
        </div>
    );
};

// --- Main Notebook Component ---
export default function CaseStudyNotebook({ open, onClose, caseStudyTitle }: CaseStudyNotebookProps) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [toc, setToc] = useState<TOCItem[]>([]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // Disable default code block
            }),
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm my-4 selection:bg-gray-700',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg shadow-md my-6 cursor-pointer hover:ring-2 hover:ring-[#FF7A00] transition-all',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#FF7A00] underline underline-offset-4 cursor-pointer',
                },
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            // Auto-save logic
            const content = editor.getHTML();
            localStorage.setItem(`mujcode_notebook_${caseStudyTitle}`, content);
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 1000);

            // TOC logic
            const headings: TOCItem[] = [];
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'heading') {
                    headings.push({
                        id: `h-${pos}`,
                        text: node.textContent,
                        level: node.attrs.level,
                    });
                }
            });
            setToc(headings);
        },
    });

    // Load initial content
    useEffect(() => {
        if (open && editor) {
            const savedContent = localStorage.getItem(`mujcode_notebook_${caseStudyTitle}`);
            if (savedContent) {
                editor.commands.setContent(savedContent);
            } else {
                editor.commands.setContent('<p>Start your research here...</p>');
            }
            setTitle(caseStudyTitle);
        }
    }, [open, editor, caseStudyTitle]);

    const handleSave = () => {
        console.log('Submitting:', { title, content: editor?.getHTML() });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] p-0 border-none bg-transparent shadow-none flex flex-col overflow-hidden outline-none sm:max-w-none translate-y-[-50%] translate-x-[-50%] top-1/2 left-1/2">
                {/* Immersive Background Blur */}
                <div className="absolute inset-0 bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[-20px_20px_60px_rgba(0,0,0,0.1),20px_-20px_60px_rgba(255,255,255,0.5)] overflow-hidden flex flex-col">

                    {/* Header Action Bar */}
                    <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm z-20">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-orange-100 rounded-lg text-[#FF7A00]">
                                <FileText className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-transparent text-xl font-bold text-gray-900 focus:outline-none w-full max-w-md selection:bg-orange-100"
                                placeholder="Untitled Analysis"
                            />
                            {isSaving && (
                                <span className="text-xs font-medium text-gray-400 animate-pulse flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Auto-saving...
                                </span>
                            )}
                            {!isSaving && (
                                <span className="text-xs font-medium text-gray-300 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Saved
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-900">
                                Save as Draft
                            </Button>
                            <Button onClick={handleSave} className="bg-[#FF7A00] hover:bg-[#FF6A00] shadow-lg shadow-orange-200">
                                <Save className="w-4 h-4 mr-2" />
                                Submit Case Study
                            </Button>
                        </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="flex-1 flex overflow-hidden">

                        {/* Left Sidebar (250px) */}
                        <div className="w-[300px] border-right border-gray-100 bg-gray-50/50 p-8 flex flex-col gap-8 overflow-y-auto">
                            {/* Metadata Section */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Metadata</h4>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-gray-400">Reference Case</span>
                                        <span className="text-sm font-semibold text-gray-700">{caseStudyTitle}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-gray-400">Word Count</span>
                                        <span className="text-sm font-semibold text-gray-700">{editor?.storage.characterCount?.words() || 0} words</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-gray-400">Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            <span className="text-sm font-semibold text-gray-700">In Progress</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table of Contents */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Contents</h4>
                                {toc.length > 0 ? (
                                    <div className="space-y-3">
                                        {toc.map((item) => (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "text-sm text-gray-500 hover:text-[#FF7A00] cursor-pointer transition-colors flex items-center gap-2",
                                                    item.level === 1 ? "font-bold text-gray-700" :
                                                        item.level === 2 ? "pl-4" : "pl-8"
                                                )}
                                            >
                                                {item.level === 1 && <ChevronRight className="w-3 h-3 text-[#FF7A00]" />}
                                                {item.text}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No headings yet...</p>
                                )}
                            </div>

                            {/* Tip/Info */}
                            <div className="mt-auto bg-white/40 p-4 rounded-xl border border-white/60">
                                <div className="flex gap-2 text-orange-600 mb-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Research Tip</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-gray-500">
                                    Use H1 and H2 tags to organize your analysis. They will automatically appear in the Table of Contents.
                                </p>
                            </div>
                        </div>

                        {/* Right Main Writing Area */}
                        <div className="flex-1 bg-gray-50/30 overflow-y-auto overflow-x-hidden flex justify-center p-12 custom-scrollbar">
                            <div className="w-full max-w-4xl bg-white min-h-full shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-x border-gray-100/50 rounded-t-lg flex flex-col">
                                <MenuBar editor={editor} />
                                <div className="prose prose-orange max-w-none p-16 editor-canvas flex-1 focus-within:outline-none">
                                    <EditorContent editor={editor} className="min-h-[500px]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    .ProseMirror {
                        outline: none !important;
                    }
                    .ProseMirror p.is-editor-empty:first-child::before {
                        content: attr(data-placeholder);
                        float: left;
                        color: #adb5bd;
                        pointer-events: none;
                        height: 0;
                    }
                    .editor-canvas ul {
                        list-style-type: disc;
                        padding-left: 1.5rem;
                    }
                    .editor-canvas ol {
                        list-style-type: decimal;
                        padding-left: 1.5rem;
                    }
                    .editor-canvas h1 {
                        font-size: 2.25rem;
                        font-weight: 800;
                        margin-bottom: 2rem;
                        color: #111827;
                    }
                    .editor-canvas h2 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                        color: #111827;
                    }
                    .editor-canvas h3 {
                        font-size: 1.25rem;
                        font-weight: 600;
                        margin-top: 1.5rem;
                        margin-bottom: 0.75rem;
                        color: #111827;
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0,0,0,0.05);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(0,0,0,0.1);
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
