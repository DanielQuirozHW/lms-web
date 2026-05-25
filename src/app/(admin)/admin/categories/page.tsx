import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Categories — Admin' }

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
      {/* CategoryManager will go here */}
    </div>
  )
}
