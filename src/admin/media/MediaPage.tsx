import { AdminHeader } from '../AdminLayout'
import { MediaLibrary } from '../ui/MediaPicker'

/**
 * The media library on its own screen.
 *
 * The same component the picker mounts, without `onPick` — so clicking a file
 * selects it for editing its alt text or deleting it, rather than choosing it
 * for a field.
 */
export default function MediaPage() {
  return (
    <>
      <AdminHeader
        title="Media"
        description="Every image and file on the site. Drag files anywhere on this page to upload them."
      />

      <div className="flex h-[calc(100dvh-9rem)] flex-col">
        <MediaLibrary />
      </div>
    </>
  )
}
