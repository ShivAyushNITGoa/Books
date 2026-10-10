// Navigation & Device Back Button History Manager for T2S Nexus
// Provides full native-app behavior for:
// 1. Android physical back button & Android 10+ swipe-from-edge gesture
// 2. iOS Safari edge-swipe back
// 3. Desktop visible Back buttons (hidden on mobile)
// 4. Desktop browser back arrow & Alt+Left shortcut

export interface ModalBackRegistration {
  id: string;
  onClose: () => void;
}

class NavigationHistoryManager {
  private modalStack: ModalBackRegistration[] = [];
  private isHandlingPopstate = false;
  private depth = 0;
  private isInitialized = false;

  public init(initialState: { view: 'gateway' | 'platform'; tab?: string }) {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Ensure baseline state in history
    if (!window.history.state || !window.history.state.t2sApp) {
      window.history.replaceState(
        {
          t2sApp: true,
          type: initialState.view,
          tab: initialState.tab || 'journey',
          depth: 0
        },
        ''
      );
      this.depth = 0;
    } else if (typeof window.history.state.depth === 'number') {
      this.depth = window.history.state.depth;
    }
  }

  public getDepth(): number {
    return this.depth;
  }

  public hasOpenModals(): boolean {
    return this.modalStack.length > 0;
  }

  public getTopModalId(): string | null {
    if (this.modalStack.length === 0) return null;
    return this.modalStack[this.modalStack.length - 1].id;
  }

  // Register an open modal/drawer/overlay and push history entry so device back closes it
  public pushModal(id: string, onClose: () => void) {
    if (typeof window === 'undefined') return;

    // Check if already on top to prevent duplicate pushes
    const existingIndex = this.modalStack.findIndex(m => m.id === id);
    if (existingIndex !== -1) {
      // Update callback
      this.modalStack[existingIndex].onClose = onClose;
      return;
    }

    this.modalStack.push({ id, onClose });
    this.depth += 1;

    try {
      window.history.pushState(
        {
          t2sApp: true,
          type: 'modal',
          modalId: id,
          depth: this.depth
        },
        ''
      );
    } catch (e) {
      console.warn('Failed to push modal state:', e);
    }
  }

  // Called when user clicks an in-app "X", "Close", or backdrop button
  public closeModal(id: string) {
    if (typeof window === 'undefined') return;

    const index = this.modalStack.findIndex(m => m.id === id);
    if (index === -1) return;

    const item = this.modalStack[index];
    // Remove from stack
    this.modalStack.splice(index, 1);

    // If this was the topmost modal and history was pushed, step back in history
    if (window.history.state?.type === 'modal' && window.history.state?.modalId === id) {
      this.isHandlingPopstate = true;
      try {
        window.history.back();
      } finally {
        setTimeout(() => {
          this.isHandlingPopstate = false;
        }, 100);
      }
    }

    // Call the modal's close handler
    try {
      item.onClose();
    } catch (e) {
      console.error('Error closing modal:', e);
    }
  }

  // Push navigation tab / platform view
  public pushTab(tab: string) {
    if (typeof window === 'undefined') return;

    // Don't push duplicate if already on this tab
    if (
      window.history.state?.type === 'tab' &&
      window.history.state?.tab === tab
    ) {
      return;
    }

    this.depth += 1;
    try {
      window.history.pushState(
        {
          t2sApp: true,
          type: 'tab',
          tab,
          depth: this.depth
        },
        ''
      );
    } catch (e) {
      console.warn('Failed to push tab state:', e);
    }
  }

  // Push Gateway view (Home Overview)
  public pushGateway() {
    if (typeof window === 'undefined') return;

    if (window.history.state?.type === 'gateway') {
      return;
    }

    this.depth += 1;
    try {
      window.history.pushState(
        {
          t2sApp: true,
          type: 'gateway',
          depth: this.depth
        },
        ''
      );
    } catch (e) {
      console.warn('Failed to push gateway state:', e);
    }
  }

  // Handle popstate event when device back or browser back is pressed
  public handlePopstate(
    e: PopStateEvent,
    callbacks: {
      onCloseModal?: (modalId: string) => void;
      onNavigateTab?: (tab: string) => void;
      onShowGateway?: () => void;
      onHideGateway?: () => void;
    }
  ): boolean {
    if (this.isHandlingPopstate) {
      return true;
    }

    // 1. If any modal is currently open, prioritize closing the topmost modal!
    if (this.modalStack.length > 0) {
      const topModal = this.modalStack.pop();
      if (topModal) {
        try {
          topModal.onClose();
          callbacks.onCloseModal?.(topModal.id);
        } catch (err) {
          console.error('Error in modal popstate close:', err);
        }
      }
      return true; // Handled modal closure
    }

    // 2. No modals open - inspect target state
    const state = e.state;
    if (state && state.t2sApp) {
      if (state.type === 'gateway') {
        callbacks.onShowGateway?.();
        return true;
      } else if (state.type === 'tab' && state.tab) {
        callbacks.onHideGateway?.();
        callbacks.onNavigateTab?.(state.tab);
        return true;
      }
    }

    // 3. Fallback: if we were in the platform and state is empty or root
    return false;
  }

  // Programmatic back trigger (for desktop Back button)
  public goBack(fallbackAction?: () => void) {
    if (typeof window === 'undefined') return;

    if (this.modalStack.length > 0) {
      const top = this.modalStack[this.modalStack.length - 1];
      this.closeModal(top.id);
      return;
    }

    if (window.history.length > 1 && this.depth > 0) {
      window.history.back();
    } else if (fallbackAction) {
      fallbackAction();
    }
  }
}

export const navHistory = new NavigationHistoryManager();
