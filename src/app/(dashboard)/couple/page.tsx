// /couple is rendered by the same view as /family — the view inspects
// the family.kind returned by /api/family (which is set from the user's
// relationship_status at creation time) and adapts labels, role
// options, and member cap accordingly. Splitting the URL keeps the two
// flows visually distinct as the user requested.
export { default } from '@/views/Family'
