
import { store } from './redux-store';

export const fetchInterval = (func, delay, tries) => {
    const pause = (delay) =>  new Promise((resolve) => setTimeout(resolve, delay));
    let triesLeft = tries;
  
    const onError = () => {
        triesLeft = tries - 1;
        if (!triesLeft) {
            return;
        }
        return pause(delay).then(() => fetchInterval(func, delay, triesLeft));
    }
    return store.dispatch(func()).then(res => res.type === 'fetch_users_error' && onError());
}
