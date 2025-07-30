'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { useContacts } from '@/contexts/contact-context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CreateContactDialogProps {
  children: React.ReactNode;
}

export function CreateContactDialog({ children }: CreateContactDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { addContact } = useContacts();
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    
    if (!name || !email) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide at least a name and an email.',
      });
      return;
    }
    
    setLoading(true);
    try {
      await addContact({
        name,
        email,
        title: formData.get('title') as string,
        company: formData.get('company') as string,
        notes: formData.get('notes') as string,
        lastContact: format(new Date(), 'yyyy-MM-dd'),
      });
      toast({
        title: 'Contact Created',
        description: `"${name}" has been added to your contacts.`,
      });
      setOpen(false);
      formRef.current.reset();
    } catch (error) {
      console.error("Error creating contact: ", error);
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: 'There was a problem saving your contact.',
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your list. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSave} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" name="name" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" name="email" type="email" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" name="title" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input id="company" name="company" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea id="notes" name="notes" className="col-span-3" />
          </div>
           <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Contact
            </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
