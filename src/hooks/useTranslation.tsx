// Patched version of useTranslation for React 19 compatibility
// react-dialect has compatibility issues with React 19
// This is a temporary workaround until the package is updated

export function useTranslation() {
    // Return identity functions - just pass through the text
    return {
        translate: (text: string) => text,
        currentLanguage: 'es',
        setCurrentLanguage: (_lang: string) => { },
    };
}

// Export a no-op Translate component
export function Translate({ children, as: Component = 'span', ...props }: any) {
    const C = Component;
    return <C {...props}>{children}</C>;
}

// Export a no-op SwitchLanguage component
export function SwitchLanguage({ className }: { className?: string }) {
    return <div className={className + " text-center"}>ES</div>;
}
