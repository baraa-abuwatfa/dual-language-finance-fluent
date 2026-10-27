import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useComingSoon } from "./use-coming-soon";

const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  user: null as { id: string } | null,
  ready: true,
  recovery: false,
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => state.navigate }));
vi.mock("@/lib/auth/AuthProvider", () => ({ useAuth: () => ({ user: state.user, ready: state.ready, recovery: state.recovery }) }));

describe("Landing account actions", () => {
  beforeEach(() => { state.user = null; state.ready = true; state.recovery = false; state.navigate.mockClear(); });

  it("sends logged-out Get Started to the existing signup page", () => {
    const { result } = renderHook(useComingSoon);
    act(() => result.current.signup());
    expect(state.navigate).toHaveBeenCalledWith({ to: "/signup" });
  });

  it("sends logged-in Get Started to the existing app entry", () => {
    state.user = { id: "signed-in-user" };
    const { result } = renderHook(useComingSoon);
    act(() => result.current.signup());
    expect(state.navigate).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("updates Get Started when the session changes", () => {
    const { result, rerender } = renderHook(useComingSoon);
    state.user = { id: "signed-in-user" };
    rerender();
    act(() => result.current.signup());
    expect(state.navigate).toHaveBeenLastCalledWith({ to: "/dashboard" });
    state.user = null;
    rerender();
    act(() => result.current.signup());
    expect(state.navigate).toHaveBeenLastCalledWith({ to: "/signup" });
  });

  it("sends Login to the existing login page", () => {
    const { result } = renderHook(useComingSoon);
    act(() => result.current.login());
    expect(state.navigate).toHaveBeenCalledWith({ to: "/auth" });
  });
  it("sends authenticated Login to Dashboard", () => {
    state.user = { id: "signed-in-user" };
    const { result } = renderHook(useComingSoon);
    act(() => result.current.login());
    expect(state.navigate).toHaveBeenCalledWith({ to: "/dashboard" });
  });
  it.each(["login", "signup"] as const)("waits for session loading before %s navigation", (action) => {
    state.ready = false;
    const { result, rerender } = renderHook(useComingSoon);
    act(() => result.current[action]());
    expect(state.navigate).not.toHaveBeenCalled();
    state.user = { id: "restored-user" }; state.ready = true;
    rerender();
    expect(state.navigate).toHaveBeenCalledExactlyOnceWith({ to: "/dashboard" });
  });
  it("does not redirect public browsing when a session loads", () => {
    state.ready = false;
    const { rerender } = renderHook(useComingSoon);
    state.ready = true; state.user = { id: "restored-user" }; rerender();
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it("preserves password recovery instead of opening Dashboard", () => {
    state.user = { id: "recovering-user" }; state.recovery = true;
    const { result } = renderHook(useComingSoon);
    act(() => result.current.login());
    expect(state.navigate).toHaveBeenCalledWith({ to: "/reset-password" });
  });
});