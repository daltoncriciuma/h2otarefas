import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings,
  LogOut,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect, useCallback } from 'react';
import logoH2o from '@/assets/logo-h2o.webp';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

function SidebarContent({ onClose, collapsed = false }: { onClose?: () => void; collapsed?: boolean }) {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sidebar to-sidebar/95 text-sidebar-foreground">
      <div className={cn("p-6 flex items-center", collapsed ? "justify-center" : "")}>
        <img 
          src={logoH2o} 
          alt="H2O Laboratório" 
          className={cn(
            "transition-all duration-300 brightness-0 invert",
            collapsed ? "h-10 w-10 object-contain" : "h-12"
          )}
        />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-3',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-ios'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-sidebar-border/50", collapsed && "px-2")}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center text-sidebar-primary-foreground font-semibold shadow-ios">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-sidebar-foreground">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center text-sidebar-primary-foreground font-semibold shadow-ios">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl"
              onClick={signOut}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-collapse after 5 seconds of no hover
  useEffect(() => {
    if (desktopCollapsed || isHovering) return;
    
    const timer = setTimeout(() => {
      setDesktopCollapsed(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [desktopCollapsed, isHovering]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setDesktopCollapsed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <>
      {/* Mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop */}
      <aside 
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300",
          desktopCollapsed ? "lg:w-20" : "lg:w-72"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarContent collapsed={desktopCollapsed} />
        
        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-6 -right-3 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/70 hover:text-sidebar-foreground transition-transform",
            desktopCollapsed && "rotate-180"
          )}
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </aside>
    </>
  );
}
