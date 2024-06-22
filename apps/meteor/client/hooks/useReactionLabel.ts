import { useCallback } from 'react';
import { useTranslation } from '@rocket.chat/ui-contexts';

const useReactionLabel = (): (() => string) => {
    const t = useTranslation();
    return useCallback(() => t('Reacted_with'), [t]);
};

export const getReactionLabel = () => {
    const getLabel = useReactionLabel();
    return getLabel();
};
// export default useReactionLabel;

