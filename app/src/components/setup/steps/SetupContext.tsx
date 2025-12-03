'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const ROLES = [
  { value: 'founder', label: 'Founder / CEO' },
  { value: 'product', label: 'Product' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'operations', label: 'Operations' },
  { value: 'sales', label: 'Sales / BD' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

interface SetupContextProps {
  onSubmit: (role: string, priority: string, companyName: string) => void;
  onBack: () => void;
}

export default function SetupContext({ onSubmit, onBack }: SetupContextProps) {
  const [role, setRole] = useState('');
  const [priority, setPriority] = useState('');
  const [companyName, setCompanyName] = useState('');

  const canContinue = role && priority.trim().length > 0;

  const handleSubmit = () => {
    if (canContinue) {
      onSubmit(role, priority, companyName);
    }
  };

  return (
    <div className="animate-fadeIn">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Quick context
      </h1>
      <p className="text-muted-foreground mb-8">
        Help Cosos understand your priorities (30 seconds)
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="role">What's your role?</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">What's your top priority this week?</Label>
          <Input
            id="priority"
            placeholder="e.g., Launch new feature, Close Series A, Hire engineers..."
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company" className="flex items-center gap-2">
            Company name
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="company"
            placeholder="Your company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button onClick={handleSubmit} disabled={!canContinue} className="gap-2">
          See what Cosos found
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

