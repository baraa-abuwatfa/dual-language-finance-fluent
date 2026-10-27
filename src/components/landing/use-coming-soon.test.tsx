import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useComingSoon } from "./use-coming-soon";

const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  user: null as { id: string } | null,
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => state.navigate }));
vi.mock("@/lib/auth/AuthProvider", () => ({ useAuth: () => ({ user: state.user }) }));

describe("Landing account actions", () => {
  beforeEach(() => { state.user = null; state.navigate.mockClear(); });

  it("sends logged-out Get Started to the existing signup page", () => {
    const { result } = renderHook(useComingSoon);
    result.current.signup();
    expect(state.navigate).toHaveBeenCalledWith({ to: "/signup" });
  });

  it("sends logged-in Get Started to the existing app entry", () => {
    state.user = { id: "signed-in-user" };
    const { result } = renderHook(useComingSoon);
    result.current.signup();
    expect(state.navigate).toHaveBeenCalledWith({ to: "/workspace" });
  });

  it("updates Get Started when the session changes", () => {
    const { result, rerender } = renderHook(useComingSoon);
    state.user = { id: "signed-in-user" };
    rerender();
    result.current.signup();
    expect(state.navigate).toHaveBeenLastCalledWith({ to: "/workspace" });
    state.user = null;
    rerender();
    result.current.signup();
    expect(state.navigate).toHaveBeenLastCalledWith({ to: "/signup" });
  });

  it("sends Login to the existing login page", () => {
    const { result } = renderHook(useComingSoon);
    result.current.login();
    expect(state.navigate).toHaveBeenCalledWith({ to: "/auth" });
  });
});