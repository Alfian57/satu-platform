import { Head, router, useForm } from '@inertiajs/react';
import {
    Briefcase,
    Check,
    CheckCircle2,
    Clock,
    Database,
    Filter,
    Pencil,
    Plus,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
    UsersRound,
    X,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type SkillItem = {
    id: number;
    name: string;
    category: string;
    description: string | null;
    isVerified: boolean;
    profileSkillsCount: number;
    projectRoleSkillsCount: number;
    createdAt: string;
    updatedAt: string;
};

type Props = {
    filters: {
        q: string;
        category: string;
        status: string;
    };
    summary: {
        totalSkills: number;
        verifiedSkills: number;
        unverifiedSkills: number;
        categoriesCount: number;
    };
    categories: string[];
    skills: SkillItem[];
};

const categoryBadgeColors: Record<string, string> = {
    software: 'border-blue-200 bg-blue-50 text-blue-800',
    design: 'border-purple-200 bg-purple-50 text-purple-800',
    data: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    management: 'border-amber-200 bg-amber-50 text-amber-800',
    devops: 'border-rose-200 bg-rose-50 text-rose-800',
    mobile: 'border-indigo-200 bg-indigo-50 text-indigo-800',
};

export default function PlatformSkillsIndex({
    filters,
    summary,
    categories,
    skills,
}: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.q || '');
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category || 'all',
    );
    const [selectedStatus, setSelectedStatus] = useState(
        filters.status || 'all',
    );

    // Modal state for Add/Edit
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
    const [deletingSkill, setDeletingSkill] = useState<SkillItem | null>(null);

    const addForm = useForm({
        name: '',
        category: 'software',
        description: '',
        is_verified: true,
    });

    const editForm = useForm({
        name: '',
        category: 'software',
        description: '',
        is_verified: true,
    });

    const filteredSkills = useMemo(() => {
        return skills.filter((item) => {
            const matchesQuery =
                !searchQuery.trim() ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description &&
                    item.description
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()));

            const matchesCategory =
                selectedCategory === 'all' ||
                item.category === selectedCategory;

            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'verified' && item.isVerified) ||
                (selectedStatus === 'unverified' && !item.isVerified);

            return matchesQuery && matchesCategory && matchesStatus;
        });
    }, [skills, searchQuery, selectedCategory, selectedStatus]);

    function handleAddSubmit(e: React.FormEvent) {
        e.preventDefault();
        addForm.post('/platform/skills', {
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
            },
        });
    }

    function handleEditOpen(skill: SkillItem) {
        setEditingSkill(skill);
        editForm.setData({
            name: skill.name,
            category: skill.category,
            description: skill.description || '',
            is_verified: skill.isVerified,
        });
    }

    function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingSkill) return;

        editForm.patch(`/platform/skills/${editingSkill.id}`, {
            onSuccess: () => {
                setEditingSkill(null);
                editForm.reset();
            },
        });
    }

    function handleToggleVerification(skill: SkillItem) {
        router.patch(
            `/platform/skills/${skill.id}/toggle-verification`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    function handleDelete(skill: SkillItem) {
        router.delete(`/platform/skills/${skill.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingSkill(null),
        });
    }

    return (
        <AppPage>
            <Head title="Taksonomi Skill - Admin Platform" />

            <div className="space-y-6">
                {/* Header Section */}
                <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                <Sparkles className="size-3.5 text-blue-600" />
                                Katalog & Taksonomi Terverifikasi
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                                Manajemen & Monitoring Taksonomi Skill
                            </h1>
                            <p className="text-sm leading-relaxed text-slate-600">
                                Kelola katalog keahlian platform SATU. Mahasiswa
                                dapat menambahkan skill secara dinamis saat
                                onboarding, dan admin platform dapat
                                memverifikasi atau merapikan kategori taksonomi.
                            </p>
                        </div>

                        {/* Action CTA */}
                        <div className="shrink-0">
                            <Button
                                onClick={() => setIsAddOpen(true)}
                                className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700"
                            >
                                <Plus className="size-4" />
                                Tambah Skill Secara Manual
                            </Button>{' '}
                        </div>
                    </div>

                    {/* Summary Metrics */}
                    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-2xs">
                            <div className="mb-1 flex items-center justify-between text-slate-500">
                                <span className="text-xs font-semibold">
                                    Total Taksonomi
                                </span>
                                <Database className="size-4 text-slate-400" />
                            </div>
                            <span className="text-2xl font-extrabold text-slate-900">
                                {summary.totalSkills}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-slate-500">
                                Skill terdaftar
                            </span>
                        </div>

                        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-2xs">
                            <div className="mb-1 flex items-center justify-between text-emerald-700">
                                <span className="text-xs font-semibold">
                                    Terverifikasi
                                </span>
                                <ShieldCheck className="size-4 text-emerald-600" />
                            </div>
                            <span className="text-2xl font-extrabold text-emerald-950">
                                {summary.verifiedSkills}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-emerald-700">
                                Standar kanonikal
                            </span>
                        </div>

                        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs">
                            <div className="mb-1 flex items-center justify-between text-amber-700">
                                <span className="text-xs font-semibold">
                                    Kontribusi Pengguna
                                </span>
                                <UsersRound className="size-4 text-amber-600" />
                            </div>
                            <span className="text-2xl font-extrabold text-amber-950">
                                {summary.unverifiedSkills}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-amber-700">
                                Dibuat melalui onboarding
                            </span>
                        </div>

                        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-2xs">
                            <div className="mb-1 flex items-center justify-between text-blue-700">
                                <span className="text-xs font-semibold">
                                    Kategori Bidang
                                </span>
                                <Briefcase className="size-4 text-blue-600" />
                            </div>
                            <span className="text-2xl font-extrabold text-blue-950">
                                {summary.categoriesCount}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-blue-700">
                                Domain keahlian
                            </span>
                        </div>
                    </div>
                </header>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs md:flex-row">
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama skill atau deskripsi..."
                            className="h-10.5 rounded-xl border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Controls */}
                    <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Filter className="size-3.5 text-slate-400" />
                            <span>Kategori:</span>
                        </div>
                        <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                        >
                            <SelectTrigger className="h-10 w-36 rounded-xl border-slate-200 text-xs font-semibold">
                                <SelectValue placeholder="Semua Kategori" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                <SelectItem value="all">
                                    Semua Kategori
                                </SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        <span className="capitalize">
                                            {cat}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 p-1">
                            <button
                                onClick={() => setSelectedStatus('all')}
                                className={cn(
                                    'cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all',
                                    selectedStatus === 'all'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800',
                                )}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setSelectedStatus('verified')}
                                className={cn(
                                    'cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all',
                                    selectedStatus === 'verified'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800',
                                )}
                            >
                                Terverifikasi
                            </button>
                            <button
                                onClick={() => setSelectedStatus('unverified')}
                                className={cn(
                                    'cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all',
                                    selectedStatus === 'unverified'
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800',
                                )}
                            >
                                Perlu Review
                            </button>
                        </div>
                    </div>
                </div>

                {/* Skills Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold tracking-wider text-slate-700 uppercase">
                                <tr>
                                    <th className="px-6 py-4">
                                        Skill & Bidang
                                    </th>
                                    <th className="px-6 py-4">Deskripsi</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">
                                        Pengguna Profil
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filteredSkills.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-slate-400"
                                        >
                                            <Briefcase className="mx-auto mb-2 size-8 text-slate-300" />
                                            <p className="text-sm font-semibold text-slate-600">
                                                Tidak ada skill yang sesuai
                                                dengan filter.
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Coba ubah kata kunci atau status
                                                filter di atas.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSkills.map((skill) => (
                                        <tr
                                            key={skill.id}
                                            className="transition-colors hover:bg-slate-50/50"
                                        >
                                            {/* Name & Category */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {skill.name}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[0.6875rem] font-bold capitalize',
                                                            categoryBadgeColors[
                                                                skill.category
                                                            ] ||
                                                                'border-slate-200 bg-slate-100 text-slate-700',
                                                        )}
                                                    >
                                                        {skill.category}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Description */}
                                            <td className="max-w-xs px-6 py-4 text-xs leading-relaxed text-slate-500">
                                                {skill.description ||
                                                    'Tidak ada deskripsi.'}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4">
                                                {skill.isVerified ? (
                                                    <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800">
                                                        <CheckCircle2 className="size-3 text-emerald-600" />
                                                        Terverifikasi
                                                    </Badge>
                                                ) : (
                                                    <Badge className="gap-1 border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800">
                                                        <Clock className="size-3 text-amber-600" />
                                                        Kontribusi Pengguna
                                                    </Badge>
                                                )}
                                            </td>

                                            {/* Usage count */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                                                    <UsersRound className="size-3.5 text-slate-400" />
                                                    {skill.profileSkillsCount}{' '}
                                                    Mahasiswa
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Toggle Verification */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleToggleVerification(
                                                                skill,
                                                            )
                                                        }
                                                        title={
                                                            skill.isVerified
                                                                ? 'Batalkan verifikasi'
                                                                : 'Verifikasi skill ini'
                                                        }
                                                        className={cn(
                                                            'h-8 cursor-pointer rounded-lg px-2.5 text-xs font-semibold',
                                                            skill.isVerified
                                                                ? 'text-amber-700 hover:bg-amber-50'
                                                                : 'text-emerald-700 hover:bg-emerald-50',
                                                        )}
                                                    >
                                                        {skill.isVerified ? (
                                                            <ShieldAlert className="mr-1 size-3.5" />
                                                        ) : (
                                                            <ShieldCheck className="mr-1 size-3.5" />
                                                        )}
                                                        {skill.isVerified
                                                            ? 'Batalkan Verifikasi'
                                                            : 'Verifikasi'}
                                                    </Button>

                                                    {/* Edit Button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEditOpen(
                                                                skill,
                                                            )
                                                        }
                                                        className="h-8 w-8 cursor-pointer rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                                        title="Ubah skill"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    {/* Delete Button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDeletingSkill(
                                                                skill,
                                                            )
                                                        }
                                                        className="h-8 w-8 cursor-pointer rounded-lg p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                        title="Hapus skill"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: Tambah Skill Manual */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs fade-in-0">
                    <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <Plus className="size-5 text-blue-600" />
                                Tambah Taksonomi Skill
                            </h3>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 text-slate-600 hover:bg-slate-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-800">
                                    Nama Skill *
                                </label>
                                <Input
                                    value={addForm.data.name}
                                    onChange={(e) =>
                                        addForm.setData('name', e.target.value)
                                    }
                                    placeholder="Contoh: Rust, FastAPI, Kubernetes..."
                                    className="h-10.5 rounded-xl border-slate-200 text-sm font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-800">
                                    Kategori Bidang *
                                </label>
                                <Select
                                    value={addForm.data.category}
                                    onValueChange={(val) =>
                                        addForm.setData('category', val)
                                    }
                                >
                                    <SelectTrigger className="h-10.5 rounded-xl border-slate-200 text-sm font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        <SelectItem value="software">
                                            Software & Web
                                        </SelectItem>
                                        <SelectItem value="design">
                                            Desain & UI/UX
                                        </SelectItem>
                                        <SelectItem value="data">
                                            Data & AI
                                        </SelectItem>
                                        <SelectItem value="mobile">
                                            Pengembangan Mobile
                                        </SelectItem>
                                        <SelectItem value="devops">
                                            DevOps & Cloud
                                        </SelectItem>
                                        <SelectItem value="management">
                                            Produk & Manajemen
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-800">
                                    Deskripsi Singkat
                                </label>
                                <textarea
                                    value={addForm.data.description}
                                    onChange={(e) =>
                                        addForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    rows={2}
                                    placeholder="Penjelasan singkat ruang lingkup skill..."
                                    className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="add_is_verified"
                                    checked={addForm.data.is_verified}
                                    onChange={(e) =>
                                        addForm.setData(
                                            'is_verified',
                                            e.target.checked,
                                        )
                                    }
                                    className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="add_is_verified"
                                    className="cursor-pointer text-xs font-semibold text-slate-800"
                                >
                                    Tandai langsung sebagai skill terverifikasi
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddOpen(false)}
                                    className="h-10 rounded-xl"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="h-10 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
                                >
                                    {addForm.processing ? (
                                        <Spinner className="mr-1.5 size-3.5" />
                                    ) : null}
                                    Simpan Skill
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Skill */}
            {editingSkill && (
                <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs fade-in-0">
                    <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <Pencil className="size-4.5 text-blue-600" />
                                Edit Taksonomi Skill
                            </h3>
                            <button
                                onClick={() => setEditingSkill(null)}
                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 text-slate-600 hover:bg-slate-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-800">
                                    Nama Skill *
                                </label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    className="h-10.5 rounded-xl border-slate-200 text-sm font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-800">
                                    Kategori Bidang *
                                </label>
                                <Select
                                    value={editForm.data.category}
                                    onValueChange={(val) =>
                                        editForm.setData('category', val)
                                    }
                                >
                                    <SelectTrigger className="h-10.5 rounded-xl border-slate-200 text-sm font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        <SelectItem value="software">
                                            Software & Web
                                        </SelectItem>
                                        <SelectItem value="design">
                                            Desain & UI/UX
                                        </SelectItem>
                                        <SelectItem value="data">
                                            Data & AI
                                        </SelectItem>
                                        <SelectItem value="mobile">
                                            Pengembangan Mobile
                                        </SelectItem>
                                        <SelectItem value="devops">
                                            DevOps & Cloud
                                        </SelectItem>
                                        <SelectItem value="management">
                                            Produk & Manajemen
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-800">
                                    Deskripsi Singkat
                                </label>
                                <textarea
                                    value={editForm.data.description}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="edit_is_verified"
                                    checked={editForm.data.is_verified}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'is_verified',
                                            e.target.checked,
                                        )
                                    }
                                    className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="edit_is_verified"
                                    className="cursor-pointer text-xs font-semibold text-slate-800"
                                >
                                    Status skill terverifikasi
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingSkill(null)}
                                    className="h-10 rounded-xl"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="h-10 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
                                >
                                    {editForm.processing ? (
                                        <Spinner className="mr-1.5 size-3.5" />
                                    ) : null}
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {deletingSkill && (
                <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs fade-in-0">
                    <div className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                            <Trash2 className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Hapus Skill Taksonomi?
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                Apakah Anda yakin ingin menghapus skill{' '}
                                <strong className="text-slate-900">
                                    "{deletingSkill.name}"
                                </strong>
                                ? Aksi ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeletingSkill(null)}
                                className="h-10 flex-1 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={() => handleDelete(deletingSkill)}
                                className="h-10 flex-1 rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
                            >
                                Hapus
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppPage>
    );
}
