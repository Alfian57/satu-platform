import { createContext, useContext } from 'react';

export interface StudentTourContextValue {
    active: boolean;
    startTour: () => void;
}

export const StudentTourContext = createContext<StudentTourContextValue>({
    active: false,
    startTour: () => {},
});

export function useStudentMenuTour(): StudentTourContextValue {
    return useContext(StudentTourContext);
}
