import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, UserPlus, Eye, EyeOff, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
      
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
      } else if (data.user && data.user.email_confirmed_at) {
        toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      } else {
        toast.success('Inscription en cours...');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        toast.error('Cette adresse email est déjà enregistrée. Utilisez l\'onglet Connexion.');
      } else if (error.message.includes('Password')) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
      } else {
        toast.error('Erreur lors de l\'inscription: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Vérifier que la connexion a bien fonctionné
      if (data.user) {
        toast.success('Connexion réussie');
        navigate('/');
      } else {
        throw new Error('Aucun utilisateur retourné');
      }
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un compte.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Veuillez confirmer votre email avant de vous connecter');
      } else {
        toast.error('Erreur lors de la connexion: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      toast.success('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
      setMode('signin');
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Devis Pro
          </CardTitle>
          <p className="text-center text-muted-foreground">
            {mode === 'forgot' 
              ? 'Réinitialiser votre mot de passe'
              : 'Connectez-vous pour accéder à votre espace'
            }
          </p>
        </CardHeader>
        <CardContent>
          {mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-forgot">Email</Label>
                <Input
                  id="email-forgot"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <span>Envoi...</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer l'email de réinitialisation
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode('signin')}
              >
                Retour à la connexion
              </Button>
            </form>
          ) : (
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'signin' | 'signup')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input
                    id="email-signin"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password-signin"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <span>Connexion...</span>
                  ) : (
                    <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={() => setMode('forgot')}
            >
              Mot de passe oublié ?
            </Button>
          </form>
        </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password-signup"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      minLength={6}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <span>Inscription...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      S'inscrire
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Vos paramètres seront sauvegardés et synchronisés
                </p>
          </form>
        </TabsContent>
      </Tabs>
          )}
    </CardContent>
      </Card>
    </div>
  );
};

export default Auth;