# Form Patterns — LMS Web

Read this before writing any form component, file upload, or submission handler.

---

## Standard form setup

Every form uses React Hook Form + Zod. Define the schema co-located with the form:

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const { mutate, isPending } = useLoginMutation()

  function onSubmit(values: FormValues) {
    mutate(values, {
      onError: (error) => {
        if (isApiError(error) && error.response.data.statusCode === 401) {
          form.setError('root', { message: 'Invalid email or password' })
        }
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Signing in...' : 'Sign in'}
        </Button>
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}
      </form>
    </Form>
  )
}
```

---

## Field-level vs root errors

| Error source             | Where to put it                                             |
| ------------------------ | ----------------------------------------------------------- |
| Zod schema violation     | `FormMessage` via `resolver` — automatic                    |
| API 400 validation error | `form.setError('fieldName', { message })`                   |
| API 401/403/409 error    | `form.setError('root', { message })` — shown below the form |
| Unexpected error         | Show a toast with a generic message                         |

---

## Zod schema conventions

Match field types to the backend DTO validation:

```typescript
const schema = z.object({
  title: z.string().min(3, 'At least 3 characters').max(200),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().uuid('Invalid category').optional(),
  coverUrl: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
})
```

---

## Pending / disabled state

Always disable the submit button and show a loading indicator while submitting:

```tsx
<Button type="submit" disabled={isPending || form.formState.isSubmitting}>
  {isPending ? <Spinner className="mr-2" /> : null}
  {isPending ? 'Saving...' : 'Save'}
</Button>
```

---

## File upload form

```tsx
const [file, setFile] = useState<File | null>(null)
const { mutate: upload, isPending } = useUploadAvatarMutation()

function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const f = e.target.files?.[0]
  if (!f) return
  // Client-side UX validation (backend enforces the real limit)
  if (f.size > 5 * 1024 * 1024) {
    toast.error('File must be under 5 MB')
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
    toast.error('Only JPG, PNG, or WebP allowed')
    return
  }
  setFile(f)
}

function handleUpload() {
  if (!file) return
  upload(file, {
    onSuccess: (url) => toast.success('Avatar updated'),
    onError: () => toast.error('Upload failed — try again'),
  })
}
```

---

## Select / enum fields

Use shadcn/ui `Select` with the controller pattern:

```tsx
<FormField
  control={form.control}
  name="type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Lesson type</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="VIDEO">Video</SelectItem>
          <SelectItem value="TEXT">Text</SelectItem>
          <SelectItem value="QUIZ">Quiz</SelectItem>
          <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Reset after success

```typescript
onSuccess: () => {
  form.reset() // clear values
  queryClient.invalidateQueries() // refresh list
  toast.success('Course created')
  router.push('/instructor/courses')
}
```

---

## Common mistakes

| Mistake                                      | Fix                                                           |
| -------------------------------------------- | ------------------------------------------------------------- | --- | ----------------------------- |
| `console.log(formValues)`                    | Remove — may contain passwords                                |
| Submitting `e.target` or `FormData` directly | Use `form.handleSubmit(onSubmit)` which provides typed values |
| Missing disabled state on submit button      | Always set `disabled={isPending}`                             |
| No `root` error display                      | Add `{form.formState.errors.root?.message}` below the form    |
| Optional URL field sending empty string      | Use `.transform(v => v                                        |     | undefined)` to omit the field |
