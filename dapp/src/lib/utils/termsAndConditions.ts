export class TermsAndConds {
    static areAccepted(): boolean {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            return JSON.parse(
                window.localStorage.getItem('terms-and-conditions-accepted') || 'false',
            );
        } catch {
            return false;
        }
    }

    static accept() {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('terms-and-conditions-accepted', 'true');
    }
}
