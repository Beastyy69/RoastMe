import { useCallback, useState } from "react"; // React ke hooks: function yaad rakhna + state

const IDLE = { status: "idle", data: null, error: null }; // shuruaati khaali state

// Ek API call ki state sambhalta hai: idle → loading → success / error.
// Use: const roast = useApiAction(api.roast); roast.run(data); roast.status, roast.data, roast.error
export function useApiAction(action) { // action = koi bhi api function (jaise api.roast)
  const [state, setState] = useState(IDLE); // abhi ki state

  // run(): call shuru, result ya error state me
  const run = useCallback( // function ko yaad rakho taaki baar-baar naya na bane
    async (...args) => { // jo bhi arguments mile wo action ko do
      setState({ status: "loading", data: null, error: null }); // loading dikhao
      try { // API call fail ho sakti hai
        const data = await action(...args); // backend ka jawab ka intezaar
        setState({ status: "success", data, error: null }); // result save karo
        return data; // caller ko bhi result do
      } catch (error) { // error aaya
        setState({ status: "error", data: null, error: error.message }); // error message save
        return null; // caller ko null
      } // try/catch band
    }, // async function band
    [action], // action badle tabhi naya run banao
  ); // useCallback band

  // reset(): wapas khaali (idle) state
  const reset = useCallback(() => setState(IDLE), []); // kabhi nahi badalta

  return { ...state, run, reset, isLoading: state.status === "loading" }; // sab kuch page ko do
} // hook band
