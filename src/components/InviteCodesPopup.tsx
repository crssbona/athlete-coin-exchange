import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Share2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const POPUP_SESSION_KEY = "invite_popup_shown";
const DISMISSED_PREFIX = "invite_popup_dismissed_";
const SHOW_DELAY_MS = 2500;
const EXIT_ANIMATION_MS = 300;

export function InviteCodesPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const dismissedKey = DISMISSED_PREFIX + user.id;
    const isDismissed = localStorage.getItem(dismissedKey) === "true";
    const shownThisSession = sessionStorage.getItem(POPUP_SESSION_KEY) === "true";

    if (isDismissed || shownThisSession) return;

    const checkInvites = async () => {
      const { data } = await supabase
        .from("invite_codes")
        .select("id")
        .eq("owner_id", user.id)
        .eq("status", "available");

      if (data && data.length > 0) {
        setAvailableCount(data.length);
        sessionStorage.setItem(POPUP_SESSION_KEY, "true");
        setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      }
    };

    checkInvites();
  }, [user?.id]);

  const dismiss = (goToSettings = false) => {
    if (dontShowAgain && user?.id) {
      localStorage.setItem(DISMISSED_PREFIX + user.id, "true");
    }
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      if (goToSettings) navigate("/settings");
    }, EXIT_ANIMATION_MS);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-primary/20 bg-card shadow-lg
        ${closing
          ? "animate-out slide-out-to-bottom-4 fade-out duration-300"
          : "animate-in slide-in-from-bottom-4 fade-in duration-300"
        }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4 text-primary" />
            </div>
            <p className="font-semibold text-sm leading-tight">
              Você tem convites para compartilhar!
            </p>
          </div>
          <button
            onClick={() => dismiss()}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-10">
          Você possui{" "}
          <span className="font-semibold text-primary">
            {availableCount} {availableCount === 1 ? "código disponível" : "códigos disponíveis"}
          </span>{" "}
          do Opatrocinador. Compartilhe com amigos!
        </p>

        <div className="pl-10 space-y-3">
          <Button size="sm" className="w-full h-8 text-xs" onClick={() => dismiss(true)}>
            Ver meus convites
          </Button>

          <div className="flex items-center gap-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="dont-show-again" className="text-[11px] text-muted-foreground cursor-pointer leading-tight">
              Não mostrar novamente
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
