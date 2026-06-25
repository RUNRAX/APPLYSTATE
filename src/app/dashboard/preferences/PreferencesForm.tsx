"use client";

import { useTransition, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateJobPreferences } from "@/app/actions/preferences";

export default function PreferencesForm({ preference }: { preference: any }) {
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSaved(false);
    
    startTransition(async () => {
      await updateJobPreferences(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    });
  };

  const [remoteChecked, setRemoteChecked] = useState(preference?.remote || false);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Input 
          name="targetRoles" 
          label="Target Roles (comma separated)" 
          placeholder="e.g. Frontend Engineer, React Developer" 
          defaultValue={preference?.targetRoles?.join(", ") || ""}
          required 
        />
        <Input 
          name="locations" 
          label="Locations (comma separated)" 
          placeholder="e.g. San Francisco, New York, Remote" 
          defaultValue={preference?.locations?.join(", ") || ""}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Experience Level</label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" name="experienceLevel" value="1" defaultChecked={preference?.experienceLevel?.includes("1")} /> Internship
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" name="experienceLevel" value="2" defaultChecked={preference?.experienceLevel?.includes("2")} /> Entry level
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" name="experienceLevel" value="3" defaultChecked={preference?.experienceLevel?.includes("3")} /> Associate
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" name="experienceLevel" value="4" defaultChecked={preference?.experienceLevel?.includes("4")} /> Mid-Senior
            </label>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Date Posted</label>
          <select 
            name="datePosted" 
            defaultValue={preference?.datePosted || ""}
            style={{ 
              width: '100%', padding: '0.75rem', borderRadius: '8px', 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', outline: 'none' 
            }}
          >
            <option value="" style={{ color: 'black' }}>Any Time</option>
            <option value="r86400" style={{ color: 'black' }}>Past 24 hours</option>
            <option value="r604800" style={{ color: 'black' }}>Past Week</option>
            <option value="r2592000" style={{ color: 'black' }}>Past Month</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Input 
          name="salaryMin" 
          label="Minimum Salary (₹)" 
          type="number"
          placeholder="e.g. 1200000" 
          defaultValue={preference?.salaryMin || ""}
        />
        <Input 
          name="dailyLimit" 
          label="Daily Application Limit" 
          type="number"
          placeholder="e.g. 10" 
          defaultValue={preference?.dailyLimit || 10}
        />
      </div>

      <Input 
        name="blacklistedComps" 
        label="Blacklisted Companies (comma separated)" 
        placeholder="e.g. Acme Corp, Evil Corp" 
        defaultValue={preference?.blacklistedComps?.join(", ") || ""}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div 
          onClick={() => setRemoteChecked(!remoteChecked)}
          style={{ 
            width: '40px', height: '24px', background: remoteChecked ? 'var(--gradient-vivid)' : 'rgba(255,255,255,0.1)', 
            borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
          }}
        >
          <input 
            type="checkbox" 
            name="remoteOnly" 
            checked={remoteChecked}
            readOnly
            style={{ display: 'none' }} 
          />
          <div style={{ 
            width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', 
            top: '3px', left: remoteChecked ? '19px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }} />
        </div>
        <span style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => setRemoteChecked(!remoteChecked)}>
          Only apply to Remote roles
        </span>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
        {isSaved && (
          <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ✓ Preferences saved!
          </span>
        )}
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? <><span className="spinner"></span> Saving...</> : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}
