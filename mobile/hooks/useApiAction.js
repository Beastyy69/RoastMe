import { useCallback, useState } from "react"; // React hooks

const IDLE = { status: "idle", data: null, error: null }; // shuruaati khaali state

// Ek API call ki state: idle → loading → success / error (website wala hi hook).
export function useApiAction(action) { // action = koi api function
  const [state, setState] = useState(IDLE); // abhi ki state

  const run = useCallback( // call chalane wala function (yaad rakha hua)
    async (...args) => { // jo arguments aaye wo action ko do
      setState({ status: "loading", data: null, error: null }); // loading
      try { // call fail ho sakti hai
        const data = await action(...args); // backend ka jawab
        setState({ status: "success", data, error: null }); // result save
        return data; // caller ko bhi do
      } catch (error) { // error aaya
        setState({ status: "error", data: null, error: error.message }); // error message save
        return null; // caller ko null
      } // try/catch band
    }, // function band
    [action], // action badle tabhi naya
  ); // useCallback band

  const reset = useCallback(() => setState(IDLE), []); // wapas khaali state

  return { ...state, run, reset, isLoading: state.status === "loading" }; // screen ko sab do
} // hook band
