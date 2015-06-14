/*-
 * Copyright (c) 2014-2015 MongoDB, Inc.
 * Copyright (c) 2008-2014 WiredTiger, Inc.    foo.
 *	All rights reserved.
 *
 * See the file LICENSE for redistribution information.
 */

struct __wt_dlh {
	TAILQ_ENTRY(__wt_dlh) q;		/* List of open libraries. */

	void	*handle;			/* Handle returned by dlopen. */
	char	*name;

	int (*terminate)(WT_CONNECTION *);	/* Terminate function. */
};
