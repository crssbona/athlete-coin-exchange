import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Users, Coins } from "lucide-react";
import { toast } from "sonner";
import { SponsorPanel } from "@/components/profile/SponsorPanel";
import { SponsoredPanel } from "@/components/profile/SponsoredPanel";

type UserRole = 'sponsor' | 'sponsored';

interface UserProfile {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  active_role: UserRole;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('sponsor');
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserRoles();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      // Se não existe perfil, cria um básico
      if (!data) {
        const newProfile = {
          id: user?.id,
          name: user?.user_metadata?.first_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
            : user?.email?.split('@')[0] || 'Usuário',
          phone: user?.user_metadata?.phone,
          document: user?.user_metadata?.document_number,
          active_role: 'sponsor' as const
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }

        setProfile(newProfile);
        setActiveRole('sponsor');
      } else {
        setProfile(data);
        setActiveRole(data.active_role || 'sponsor');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (error) throw error;
      setUserRoles(data?.map(r => r.role) || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const toggleRole = async (newRole: UserRole) => {
    // Add role if not exists
    if (!userRoles.includes(newRole)) {
      try {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user?.id, role: newRole });

        if (error) throw error;
        setUserRoles([...userRoles, newRole]);
      } catch (error) {
        console.error('Error adding role:', error);
        toast.error('Erro ao adicionar papel');
        return;
      }
    }

    // Update active role
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active_role: newRole })
        .eq('id', user?.id);

      if (error) throw error;
      setActiveRole(newRole);
      toast.success(`Modo ${newRole === 'sponsor' ? 'Patrocinador' : 'Patrocinado'} ativado`);
    } catch (error) {
      console.error('Error updating active role:', error);
      toast.error('Erro ao alternar papel');
    }
  };

  if (loading || loadingProfile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <p>Carregando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12 bg-background">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{profile?.name || 'Usuário'}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    {userRoles.map(role => (
                      <Badge key={role} variant={role === activeRole ? "default" : "outline"}>
                        {role === 'sponsor' ? 'Patrocinador' : 'Patrocinado'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="role-toggle"
                      checked={activeRole === 'sponsored'}
                      onCheckedChange={(checked) => toggleRole(checked ? 'sponsored' : 'sponsor')}
                    />
                    <Label htmlFor="role-toggle" className="cursor-pointer">
                      Modo {activeRole === 'sponsor' ? 'Patrocinador' : 'Patrocinado'}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content based on active role */}
          {activeRole === 'sponsor' ? (
            <SponsorPanel userId={user?.id || ''} />
          ) : (
            <SponsoredPanel userId={user?.id || ''} profile={profile} />
          )}
        </div>
      </div>
    </>
  );
}
