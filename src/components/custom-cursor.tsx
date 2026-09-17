"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
    const blob = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Only initialize on devices with a physical mouse
        if (window.matchMedia("(hover: none)").matches) return;
        setMounted(true);

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let blobX = mouseX;
        let blobY = mouseY;
        let isHovering = false;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Check if hovering over clickable element to expand blob and intensify
            const target = e.target as HTMLElement;
            isHovering = !!target.closest('a, button, input, select, textarea, [role="button"]');
        };

        window.addEventListener("mousemove", onMouseMove);

        // Physics-based smooth follow logic for the blob
        let animationFrameId: number;
        const render = () => {
            blobX += (mouseX - blobX) * 0.12; // Fluid, slightly delayed spring physics
            blobY += (mouseY - blobY) * 0.12;

            if (blob.current) {
                // Expanding the ambient blob when hovering over interactive elements
                const scale = isHovering ? 'scale(1.5)' : 'scale(1)';
                blob.current.style.transform = `translate3d(${blobX}px, ${blobY}px, 0) translate(-50%, -50%) ${scale}`;
                blob.current.style.opacity = isHovering ? "0.9" : "0.5";
            }
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden mix-blend-difference hidden md:block">
            {/* Soft, glowing, heavily blurred ambient negative-space blob */}
            <div
                ref={blob}
                className="absolute left-0 top-0 h-40 w-40 rounded-full bg-white opacity-50 blur-[40px] transition-[opacity,transform] duration-500 ease-out"
                style={{ willChange: 'transform, opacity' }}
            />
        </div>
    );
}
