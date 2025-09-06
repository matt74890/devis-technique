import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calculator, Settings, Building2 } from 'lucide-react';
import DevisScreen from './screens/DevisScreen';
import RecapScreen from './screens/RecapScreen';
import SettingsScreen from './screens/SettingsScreen';

const Layout = () => {
  const [activeTab, setActiveTab] = useState('devis');

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Devis Techniques
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestion professionnelle des devis
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex bg-card shadow-soft">
            <TabsTrigger 
              value="devis" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4" />
              <span>Devis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="recap" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calculator className="h-4 w-4" />
              <span>Récap & PDF</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devis" className="mt-6">
            <DevisScreen />
          </TabsContent>
          
          <TabsContent value="recap" className="mt-6">
            <RecapScreen />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <SettingsScreen />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Layout;