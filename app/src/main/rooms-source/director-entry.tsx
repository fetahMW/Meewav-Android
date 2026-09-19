import { createRoot } from 'react-dom/client';
import RoomVideoDirector from './RoomVideoDirector';
import './director-embed.css';
createRoot(document.getElementById('root')!).render(<RoomVideoDirector native />);
