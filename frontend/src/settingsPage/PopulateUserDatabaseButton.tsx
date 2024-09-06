import React, { FC, useState } from "react";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";

interface ButtonWithLoadingStateProps {
    actionCallback: () => Promise<Response>;
    text: string;
}

export const ButtonWithLoadingState: FC<ButtonWithLoadingStateProps> = ({actionCallback, text}) => {
    const [isLoading, setIsLoading] = useState(false)
    const onClick = async (): Promise<void> => {
        setIsLoading(true)
        try {
            await actionCallback()
        }
        finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="py-4 px-2 space-y-2">
            <div className="flex justify-between">
                <Button disabled={isLoading} className={isLoading ? "disabled" : undefined} onClick={onClick}>{isLoading ? <LoadingSpinner />: text}</Button>
            </div>
        </div>
  );
};
