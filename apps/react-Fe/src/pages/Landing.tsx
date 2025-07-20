import MyComp from "../components/MyComp";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { increment, decrement } from "../store/slices/counter/counter";

const Landing = () => {
  const count: any = useAppSelector((state) => state.counter);
  const dispatch = useAppDispatch();

return (
    <div className="App">
      <header className="App-header">
        <h1>Count is {count}</h1>
        <button className="px-4" onClick={() => dispatch(increment())}>Increment</button>
        <button onClick={() => dispatch(decrement())}>Decrement</button>
      </header>

      <MyComp />
    </div>
  );
}

export default Landing
