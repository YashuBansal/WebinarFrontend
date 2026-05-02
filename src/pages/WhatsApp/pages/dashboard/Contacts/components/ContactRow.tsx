import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Phone, Edit, Trash2 } from 'lucide-react';
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
    <TableRow>
      {onSelectContact && (
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectContact(contact._id)}
          />
        </TableCell>
      )}
      <TableCell>
        <span className="font-semibold">{contact.firstName}</span>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground">{contact.lastName || '-'}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span>{contact.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span>{contact.phone}</span>
        </div>
      </TableCell>
      <TableCell>
        {contact.tags && contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {displayTags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {extraTagCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{extraTagCount}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No tags</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(contact)}>
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={() => onDelete(contact)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

const ContactRow = React.memo(ContactRowBase);
export default ContactRow;

