"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
    const dot = useRef<HTMLDivElement>(null);
    const ring = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Only initialize on devices with a physical mouse
        if (window.matchMedia("(hover: none)").matches) return;
        setMounted(true);

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;
        let isHovering = false;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (dot.current) {
                dot.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) ${isHovering ? 'scale(0)' : 'scale(1)'}`;
            }

            // Check if hovering over clickable element to expand ring
            const target = e.target as HTMLElement;
            if (target.closest('a, button, input, select, textarea, [role="button"]')) {
                isHovering = true;
                if (ring.current) ring.current.style.opacity = "0.2";
            } else {
                isHovering = false;
                if (ring.current) ring.current.style.opacity = "0.5";
            }
        };

        const onMouseDown = () => {
            if (ring.current) ring.current.style.borderWidth = "4px";
        };
        const onMouseUp = () => {
            if (ring.current) ring.current.style.borderWidth = "1px";
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);

        // Physics-based smooth follow logic for the trailing ring
        let animationFrameId: number;
        const render = () => {
            ringX += (mouseX - ringX) * 0.15; // Smooth spring physics
            ringY += (mouseY - ringY) * 0.15;
            if (ring.current) {
                ring.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) ${isHovering ? 'scale(1.5)' : 'scale(1)'}`;
            }
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseup", onMouseUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden mix-blend-difference hidden md:block">
            {/* Tiny primary dot mapped directly to cursor */}
            <div
                ref={dot}
                className="absolute left-0 top-0 h-2 w-2 rounded-full bg-white transition-transform duration-100 ease-out"
                style={{ willChange: 'transform' }}
            />
            {/* Smooth trailing physics ring */}
            <div
                ref={ring}
                className="absolute left-0 top-0 h-10 w-10 rounded-full border border-white transition-[border-width,opacity] duration-200 ease-out"
                style={{ willChange: 'transform, opacity, border-width' }}
            />
        </div>
    );
}
