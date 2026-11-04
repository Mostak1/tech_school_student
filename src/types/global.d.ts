export { };

declare global {
    interface Window {
        MathJax?: {
            typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
            typeset?: (elements?: HTMLElement[]) => void;
            tex?: {
                inlineMath?: string[][];
                displayMath?: string[][];
                processEscapes?: boolean;
            };
            svg?: {
                fontCache?: string;
            };
            options?: {
                skipHtmlTags?: string[];
            };
            startup?: {
                typeset?: boolean;
            };
        };
    }
}
