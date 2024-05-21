import { api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser, AtLeast } from '@rocket.chat/core-typings';

import { roomCoordinator } from '../../../../../server/lib/rooms/roomCoordinator';
import { metrics } from '../../../../metrics/server';
import { settings } from '../../../../settings/server';
import { Meteor } from 'meteor/meteor';

/**
 * Send notification to user
 *
 * @param {string} userId The user to notify
 * @param {object} user The sender
 * @param {object} room The room send from
 * @param {object} message The message object
 * @param {number} duration Duration of notification
 * @param {string} notificationMessage The message text to send on notification body
 */
export async function notifyDesktopUser({
	userId,
	user,
	message,
	room,
	duration,
	notificationMessage,
	reaction
}: {
	userId: string;
	user: AtLeast<IUser, '_id' | 'name' | 'username'>;
	message: IMessage | Pick<IMessage, 'u'>;
	room: IRoom;
	duration?: number;
	notificationMessage: string;
	reaction : string;
}): Promise<void> {
	const { title, text, name } = await roomCoordinator
		.getRoomDirectives(room.t)
		.getNotificationDetails(room, user, notificationMessage, userId);
	console.log(user._id);
	console.log(userId);
	console.log(Meteor.userId());
	
	console.log("user 23434234234");
	// console.log('message payload 23434234234');
	// console.log('message payload 23434234234');

	const payload = {
		title: title || '',
		text : reaction !== '' ? reaction : text,
		reacted : reaction !== ''? true :undefined,
		duration,
		payload: {
			_id: '',
			rid: '',
			tmid: '',
			...('_id' in message && {
				// TODO: omnichannel is not sending _id, rid, tmid
				_id: message._id,
				rid: message.rid,
				tmid: message.tmid,
			}),
			sender: message.u,
			// sender: { _id: user._id, username: user.username, name: user.name },
			type: room.t,
			message: {
				msg: 'msg' in message ? message.msg : '',
				...('t' in message && {
					t: message.t,
				}),
			},
			name,
		},
	};

	metrics.notificationsSent.inc({ notification_type: 'desktop' });
	const receiver_id = 'reactions' in message ? user._id : userId
	console.log(receiver_id);
	console.log(Meteor.userId());
	
	void api.broadcast('notify.desktop',userId , payload);
}

export function shouldNotifyDesktop({
	disableAllMessageNotifications,
	status,
	statusConnection,
	desktopNotifications,
	hasMentionToAll,
	hasMentionToHere,
	isHighlighted,
	hasMentionToUser,
	hasReplyToThread,
	roomType,
	isThread,
}: {
	disableAllMessageNotifications: boolean;
	status: string;
	statusConnection: string;
	desktopNotifications: string | undefined;
	hasMentionToAll: boolean;
	hasMentionToHere: boolean;
	isHighlighted: boolean;
	hasMentionToUser: boolean;
	hasReplyToThread: boolean;
	roomType: string;
	isThread: boolean;
}): boolean {
	if (disableAllMessageNotifications && !desktopNotifications && !isHighlighted && !hasMentionToUser && !hasReplyToThread) {
		return false;
	}

	if (statusConnection === 'offline' || status === 'busy' || desktopNotifications === 'nothing') {
		return false;
	}

	if (!desktopNotifications) {
		if (settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'all' && (!isThread || hasReplyToThread)) {
			return true;
		}
		if (settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'nothing') {
			return false;
		}
	}

	return (
		(roomType === 'd' ||
			(!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) ||
			isHighlighted ||
			desktopNotifications === 'all' ||
			hasMentionToUser) &&
		(isHighlighted || !isThread || hasReplyToThread)
	);
}
