import type { IRoom, IMessage, MessageTypesValues } from '@rocket.chat/core-typings';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { Mongo } from 'meteor/mongo';
import { useCallback, useMemo } from 'react';

import { ChatMessage } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useRoom } from '../../contexts/RoomContext';

const mergeHideSysMessages = (
	sysMesArray1: Array<MessageTypesValues>,
	sysMesArray2: Array<MessageTypesValues>,
): Array<MessageTypesValues> => {
	return Array.from(new Set([...sysMesArray1, ...sysMesArray2]));
};

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): IMessage[] => {
	console.log("inside usemsg")
	const showThreadsInMainChannel = useUserPreference<boolean>('showThreadsInMainChannel', false);
	const hideSysMesSetting = useSetting<MessageTypesValues[]>('Hide_System_Messages') ?? [];
	const room = useRoom();
	const hideRoomSysMes: Array<MessageTypesValues> = Array.isArray(room.sysMes) ? room.sysMes : [];

	const hideSysMessages = useStableArray(mergeHideSysMessages(hideSysMesSetting, hideRoomSysMes));

	const query: Mongo.Selector<IMessage> = useMemo(
		() => ({
			rid,
			_hidden: { $ne: true },
			t: { $nin: hideSysMessages },
			...(!showThreadsInMainChannel && {
				$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
			}),
		}),
		[rid, hideSysMessages, showThreadsInMainChannel],
	);
	console.log(query)

	return useReactiveValue(
		useCallback(
			() =>{
				// console.log("chat msg query")
				const res =  ChatMessage.find(query, {
					sort: {
						ts: 1,
					},
				}).fetch()
				
				console.log("res")
				console.log(res)
			return res
			},
			[query],
		),
	);
};
