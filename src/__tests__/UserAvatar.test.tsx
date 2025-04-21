import { render, screen, waitFor } from "@testing-library/react";
import UserAvatar from "../components/UserAvatar";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import '@testing-library/jest-dom';

jest.mock("@/utils/supabase/client", () => ({
    createClient: jest.fn(),
}));

jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/app/account/avatar", () => ({
    __esModule: true,
    default: ({ uid, url, size }: { uid: string; url: string; size: number }) => (
        <div data-testid="avatar" data-uid={uid} data-url={url} data-size={size}></div>
    ),
}));

describe("UserAvatar", () => {
    const mockUser: User = {
        id: "123",
        app_metadata: {},
        user_metadata: {},
        aud: "",
        created_at: "",
    };

    const mockSupabase = {
        auth: {
            getUser: jest.fn(),
        },
    };

    beforeEach(() => {
        (createClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders nothing when no user is logged in", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

        render(<UserAvatar />);

        await waitFor(() => {
            expect(screen.queryByTestId("avatar")).not.toBeInTheDocument();
        });
    });

    it("renders the avatar when a user is logged in", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

        render(<UserAvatar />);

        await waitFor(() => {
            expect(screen.getByTestId("avatar")).toBeInTheDocument();
            expect(screen.getByTestId("avatar")).toHaveAttribute("data-uid", "123");
            expect(screen.getByTestId("avatar")).toHaveAttribute("data-url", "123");
            expect(screen.getByTestId("avatar")).toHaveAttribute("data-size", "40");
        });
    });
});