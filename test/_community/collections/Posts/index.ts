import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
    },

    // ── Reproduction case 1 ──────────────────────────────────────────────────
    // A required number field with admin.condition (GraphQL nullability
    // workaround) and a typescriptSchema override.
    // Expected generated type: `myNumberWithCondition: number`   (non-optional)
    // Actual generated type:   `myNumberWithCondition?: number`  (optional)
    {
      name: 'myNumberWithCondition',
      type: 'number',
      required: true,
      defaultValue: 10,
      typescriptSchema: [() => ({ type: 'number' })],
      admin: {
        // Workaround from https://github.com/payloadcms/payload/discussions/15811
        // to make the field non-null in GraphQL — but it silently breaks
        // TypeScript type generation because fieldIsRequired() returns false
        // for any field with admin.condition defined.
        condition: () => true,
      },
    },

    // ── Reproduction case 2 ──────────────────────────────────────────────────
    // Same field WITHOUT admin.condition. field.required: true is respected
    // and the field IS required in the generated types — showing that
    // typescriptSchema cannot independently opt a field in; only field.required
    // can. This case is correct and included for comparison only.
    {
      name: 'myNumber',
      type: 'number',
      required: true,
      defaultValue: 10,
      typescriptSchema: [() => ({ type: 'number' })],
      // No admin.condition → myNumber: number  ✓
    },
  ],
}
