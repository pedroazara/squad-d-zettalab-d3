import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { DashboardSkeleton } from "./components/skeletons/DashboardSkeleton";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const DashboardNacional = lazy(() => import("@/pages/DashboardNacional"));
const DashboardEstados = lazy(() => import("@/pages/DashboardEstados"));
const DashboardBiodiversidade = lazy(() => import("@/pages/DashboardBiodiversidade"));
const DashboardTendencias = lazy(() => import("@/pages/DashboardTendencias"));
const DashboardOcorrencias = lazy(() => import("@/pages/DashboardOcorrencias"));
const Educativo = lazy(() => import("@/pages/Educativo"));
const EducativoDetalhes = lazy(() => import("@/pages/EducativoDetalhes"));
const Sobre = lazy(() => import("@/pages/Sobre"));
const Metodologia = lazy(() => import("@/pages/Metodologia"));
const Api = lazy(() => import("@/pages/Api"));
const Contato = lazy(() => import("@/pages/Contato"));
const Perfil = lazy(() => import("@/pages/Perfil"));


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/cadastro"} component={Register} />
      <Route path={"/dashboard/nacional"}>
        {() => <ProtectedRoute component={DashboardNacional} />}
      </Route>
      <Route path={"/dashboard/estados"}>
        {() => <ProtectedRoute component={DashboardEstados} />}
      </Route>
      <Route path={"/dashboard/estados/:sigla"}>
        {() => <ProtectedRoute component={DashboardEstados} />}
      </Route>
      <Route path={"/dashboard/biodiversidade"}>
        {() => <ProtectedRoute component={DashboardBiodiversidade} />}
      </Route>
      <Route path={"/dashboard/tendencias"}>
        {() => <ProtectedRoute component={DashboardTendencias} />}
      </Route>
      <Route path={"/dashboard/ocorrencias"}>
        {() => <ProtectedRoute component={DashboardOcorrencias} />}
      </Route>
      <Route path={"/educativo"} component={Educativo} />
      <Route path={"/educativo/artigo/:id"} component={EducativoDetalhes} />
      <Route path={"/sobre"} component={Sobre} />
      <Route path={"/metodologia"} component={Metodologia} />
      <Route path={"/api"} component={Api} />
      <Route path={"/contato"} component={Contato} />
      <Route path={"/perfil"}>
        {() => <ProtectedRoute component={Perfil} />}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LoadingProvider>
          <TooltipProvider>
            <Toaster />
            <div className="min-h-screen bg-guarawatch-bg text-guarawatch-text dark:bg-slate-950 dark:text-slate-100">
              <Suspense
                fallback={
                  <div className="min-h-screen bg-guarawatch-surface">
                    <DashboardSkeleton />
                  </div>
                }
              >
                <Router />
              </Suspense>
            </div>
          </TooltipProvider>
        </LoadingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
