import { useIdentity } from "../IdentityProvider";

type ChildProps = {
    resetAll: () => void;
}

export function LoginLogout({ resetAll }: ChildProps) {
const { state, login, logout } = useIdentity();
    
 return (
    <div>
        <p>Identity: {state.principal?.toText() ?? "2vxsx-fae"}</p>
        {
        !state.isAuthenticated ?
        <button onClick={async () => { resetAll(); await login() }}>Login (optional)</button> :
        <button onClick={async () => { resetAll(); await logout() }}>Logout</button>
        }
    </div>
 )
}