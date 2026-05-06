import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Phone, Edit, Trash2, User, ChevronRight } from 'lucide-react';
import type { Contact } from '@/schemas/contactSchema';

interface ContactRowProps {
  contact: Contact;
  isSelected: boolean;
  onSelectContact?: (contactId: string) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}

function ContactRowBase({
  contact,
  isSelected,
  onSelectContact,
  onEdit,
  onDelete,
}: ContactRowProps) {
  const displayTags = useMemo(() => (contact.tags || []).slice(0, 3), [contact.tags]);
  const extraTagCount = (contact.tags?.length || 0) - displayTags.length;

  return (
    <TableRow className={`group transition-colors duration-200 ${isSelected ? 'bg-green-50/30' : 'hover:bg-slate-50/50'}`}>
      {onSelectContact && (
        <TableCell className="px-6 py-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectContact(contact._id)}
            className="rounded-md border-slate-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 transition-all duration-200"
          />
        </TableCell>
      )}
      <TableCell className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-green-600 group-hover:border-green-100 transition-all duration-300">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none mb-1">{contact.firstName}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subscriber</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4">
        <span className="text-sm font-medium text-slate-600">{contact.lastName || '-'}</span>
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="flex items-center gap-2 group/info">
          <div className="h-6 w-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover/info:text-blue-500 group-hover/info:border-blue-100 transition-colors">
            <Mail className="h-3 w-3" />
          </div>
          <span className="text-sm font-medium text-slate-600">{contact.email}</span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="flex items-center gap-2 group/info">
          <div className="h-6 w-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover/info:text-green-500 group-hover/info:border-green-100 transition-colors">
            <Phone className="h-3 w-3" />
          </div>
          <span className="text-sm font-bold text-slate-700">{contact.phone}</span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4">
        {contact.tags && contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-slate-50 border-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-lg group-hover:bg-white transition-colors">
                {tag}
              </Badge>
            ))}
            {extraTagCount > 0 && (
              <Badge variant="secondary" className="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5 rounded-lg shadow-sm">
                +{extraTagCount}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Tags</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5 transition-all duration-300">
          {onEdit && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(contact)}
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(contact)}
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

const ContactRow = React.memo(ContactRowBase);
export default ContactRow;

