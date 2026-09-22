"use client"

import { useBuilderStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function IdentitySection() {
  const spec = useBuilderStore((s) => s.spec)
  const updateIdentity = useBuilderStore((s) => s.updateIdentity)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Agent ID</label>
          <Input
            placeholder="my-agent"
            value={spec.id || ""}
            onChange={(e) => updateIdentity("id", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
          <Input
            placeholder="Customer Support Agent"
            value={spec.name || ""}
            onChange={(e) => updateIdentity("name", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
        <Input
          placeholder="Senior customer support specialist"
          value={spec.role || ""}
          onChange={(e) => updateIdentity("role", e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Purpose</label>
        <Textarea
          placeholder="Help users resolve issues quickly and efficiently..."
          value={spec.purpose || ""}
          onChange={(e) => updateIdentity("purpose", e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Expertise <span className="text-muted-foreground">(comma-separated)</span>
        </label>
        <Input
          placeholder="billing, technical support, product knowledge"
          value={(spec.expertise || []).join(", ")}
          onChange={(e) =>
            updateIdentity(
              "expertise",
              e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
            )
          }
        />
      </div>
    </div>
  )
}
