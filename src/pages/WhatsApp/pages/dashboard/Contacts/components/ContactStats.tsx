import { Card, CardContent } from '@/components/ui/card';
import { Users, Mail, Phone } from 'lucide-react';
import type { ContactStats as ContactStatsType } from '@/schemas/contactSchema';

interface ContactStatsProps {
  stats: ContactStatsType;
}

export default function ContactStats({ stats }: ContactStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
              <p className="text-2xl font-bold">{stats.totalContacts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active Contacts</p>
              <p className="text-2xl font-bold">{stats.activeContacts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Inactive Contacts</p>
              <p className="text-2xl font-bold">{stats.inactiveContacts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
