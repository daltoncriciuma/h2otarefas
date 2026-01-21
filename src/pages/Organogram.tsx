import { AppLayout } from '@/components/layout/AppLayout';
import { Canvas } from '@/components/organogram/Canvas';

const Organogram = () => {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-2rem)] w-full">
        <Canvas />
      </div>
    </AppLayout>
  );
};

export default Organogram;
