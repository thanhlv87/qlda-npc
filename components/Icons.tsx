import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const CalendarIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
);

export const CompanyIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" {...props}>
        <path fillRule="evenodd" d="M4 16.5v-13h12v13h-2.5v-6h-7v6H4zM3 2.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5-.5h-13a.5.5 0 0 1-.5-.5v-14zM8.5 4a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2z" clipRule="evenodd" />
    </svg>
);

export const UserCircleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" {...props}>
        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
    </svg>
);

export const PhoneIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" {...props}>
        <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5h-1.528a1.5 1.5 0 0 1-1.465-1.175l-.716-3.223a1.5 1.5 0 0 1 .43-1.448l.156-.129a.75.75 0 0 0-.533-1.265l-2.62 (1.123a.75.75 0 0 0-.665.176l-.283.255a.75.75 0 0 1-1.002-.187a7.49 7.49 0 0 1-3.37-3.37.75.75 0 0 1 .188-1.002l.255-.283a.75.75 0 0 0 .176-.665l-1.123-2.62a.75.75 0 0 0-1.265-.533l-.129.156a1.5 1.5 0 0 1-1.448.43L3.675 3.675A1.5 1.5 0 0 1 2.5 2.227V3.5Z" clipRule="evenodd" />
    </svg>
);

export const UserGroupIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" {...props}>
        <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.25 1.25 0 0 1 .411-1.493 5.01 5.01 0 0 1 7.182 0 1.25 1.25 0 0 1 .411 1.493 5.01 5.01 0 0 1-8 0ZM15.75 16a.75.75 0 0 0 .75-.75 4.5 4.5 0 0 0-8.995- .497.75.75 0 0 0 1.49-.154 3 3 0 0 1 5.995.301.75.75 0 0 0 .75.75Z" />
        <path d="M13.5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
);

export const MenuIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const MailIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3Z" />
        <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839Z" />
    </svg>
);

export const LockClosedIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1Zm3 8V5.5a3 3 0 10-6 0V9h6Z" clipRule="evenodd" />
    </svg>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);
  
export const DownloadIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
);

export const ExclamationCircleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M3.75 3A1.75 1.75 0 002 4.75v10.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-8.5A1.75 1.75 0 0016.25 5h-6.53a1.75 1.75 0 01-1.238-.513L6.904 3.513A1.75 1.75 0 005.667 3H3.75z" />
  </svg>
);

export const FileIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.707a2 2 0 00-.586-1.414l-4-4A2 2 0 0011.707 2H4zm6 6a1 1 0 10-2 0v4a1 1 0 102 0V8z" clipRule="evenodd" />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l.88-1.467a1.65 1.65 0 012.298-.55l1.432.859a1.65 1.65 0 011.956 0l1.555-.933a1.65 1.65 0 012.298.55l.88 1.467a1.65 1.65 0 010 1.18l-.88 1.467a1.65 1.65 0 01-2.298.55l-1.432-.859a1.65 1.65 0 01-1.956 0l-1.555.933a1.65 1.65 0 01-2.298-.55L.664 10.59zM10 15a5 5 0 100-10 5 5 0 000 10z" clipRule="evenodd" />
    </svg>
);

export const ExclamationTriangleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

export const PauseIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
    </svg>
);

export const CogIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.948-2.287c-1.56-.379-1.56-2.6 0-2.978a1.532 1.532 0 01.948-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

export const PencilSquareIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
);

export const HardHatIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M4 16.5v-13h12v13h-2.5v-6h-7v6H4zM3 2.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5-.5h-13a.5.5 0 0 1-.5-.5v-14zM8.5 4a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2z" clipRule="evenodd" />
    </svg>
);

export const DocumentCheckIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M2 3.5A1.5 1.5 0 013.5 2h13A1.5 1.5 0 0118 3.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 16.5v-13zM3.5 3a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5h-13z" />
      <path d="M5 6.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v7a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-7zM8.5 8a.5.5 0 00-.5.5v5a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-5a.5.5 0 00-.5-.5h-1zM12 9.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-4z" />
    </svg>
);

export const RectangleStackIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M2.875 3.5C2.379 3.5 2 3.879 2 4.375v11.25c0 .496.379.875.875.875h14.25c.496 0 .875-.379.875-.875V4.375c0-.496-.379-.875-.875-.875H2.875zM15 6.25a.75.75 0 000-1.5h-2a.75.75 0 000 1.5h2zM12.25 9a.75.75 0 00-1.5 0v2a.75.75 0 001.5 0v-2zM15 9.75a.75.75 0 000-1.5h-2a.75.75 0 000 1.5h2z" />
      <path d="M1.995 6.113A1.375 1.375 0 001.25 7.5v8.125c0 .621.504 1.125 1.125 1.125H16.25a.75.75 0 00.75-.75v-.625a.75.75 0 00-.75-.75H3.375A1.375 1.375 0 012 13.625v-7.512z" />
    </svg>
);

export const TrophyIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M15.5 2.5a3 3 0 00-3-3H7.5a3 3 0 00-3 3v.571c0 1.312.466 2.52 1.29 3.48L7.5 9.278V14.5a1 1 0 001 1h3a1 1 0 001-1V9.278l1.71-2.727c.823-.96 1.29-2.168 1.29-3.48V2.5zM17 6.5h-1.5a.5.5 0 010-1H17a.5.5 0 010 1zM4.5 5.5H3a.5.5 0 010-1h1.5a.5.5 0 010 1z" />
      <path d="M4 17.5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v.518a2 2 0 0 0 .53 1.414l.256.256a2 2 0 0 0 1.414.53h.518a.75.75 0 0 1 0 1.5h-.518a2 2 0 0 0-1.414.53l-.256.256a2 2 0 0 0-.53 1.414v.518a.75.75 0 0 1-1.5 0v-.518a2 2 0 0 0-.53-1.414l-.256-.256a2 2 0 0 0-1.414-.53h-.518a.75.75 0 0 1 0-1.5h.518a2 2 0 0 0 1.414-.53l.256-.256a2 2 0 0 0 .53-1.414v-.518A.75.75 0 0 1 10 2ZM8.05 4.95a.75.75 0 0 1 1.06 0l.256.256a2 2 0 0 0 1.414.53h.172a.75.75 0 0 1 0 1.5h-.172a2 2 0 0 0-1.414.53l-.256.256a.75.75 0 0 1-1.06 0l-.256-.256a2 2 0 0 0-1.414-.53H6.25a.75.75 0 0 1 0-1.5h.172a2 2 0 0 0 1.414-.53l.256-.256Z M4.95 8.05a.75.75 0 0 1 0 1.06l-.256.256a2 2 0 0 0-.53 1.414v.172a.75.75 0 0 1-1.5 0v-.172a2 2 0 0 0-.53-1.414l-.256-.256a.75.75 0 0 1 0-1.06l.256-.256a2 2 0 0 0 .53-1.414V6.25a.75.75 0 0 1 1.5 0v.172a2 2 0 0 0 .53 1.414l.256.256Zm8.06 0a.75.75 0 0 1 1.06 0l.256.256a2 2 0 0 0 1.414.53h.172a.75.75 0 0 1 0 1.5h-.172a2 2 0 0 0-1.414.53l-.256.256a.75.75 0 0 1-1.06 0l-.256-.256a2 2 0 0 0-1.414-.53h-.172a.75.75 0 0 1 0-1.5h.172a2 2 0 0 0 1.414-.53l.256.256Z" clipRule="evenodd" />
    </svg>
);

export const TuneIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M3 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm2-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM3 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm2-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM3 14a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm2-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" clipRule="evenodd" />
        <path d="M8 5a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Z" />
    </svg>
);

export const ChartBarIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M11 1a1 1 0 10-2 0v1a1 1 0 102 0V1zM5 16a1 1 0 10-2 0v1a1 1 0 102 0v-1zM16 16a1 1 0 10-2 0v1a1 1 0 102 0v-1z"/>
        <path fillRule="evenodd" d="M2 5a1 1 0 011-1h14a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm4 2a1 1 0 10-2 0v4a1 1 0 102 0V7zm4 0a1 1 0 10-2 0v4a1 1 0 102 0V7zm4-1a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

export const DocumentDuplicateIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M7 3.5A1.5 1.5 0 018.5 2h5.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0119 6.622V16.5A1.5 1.5 0 0117.5 18h-9A1.5 1.5 0 017 16.5v-13z" />
        <path d="M2 6.5A1.5 1.5 0 013.5 5h8A1.5 1.5 0 0113 6.5v1A1.5 1.5 0 0111.5 9h-8A1.5 1.5 0 012 7.5v-1z" />
    </svg>
);

export const PhotographIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909-.48-.48a.75.75 0 00-1.06 0l-5.18 5.181-1.65-1.65a.75.75 0 00-1.06 0L2.5 11.06zM15 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd" />
    </svg>
);

export const TrendingUpIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M12.232 4.232a.75.75 0 011.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 011.06-1.06l1.72 1.72 3.72-3.72z" />
        <path d="M3.75 13.5A.75.75 0 013 12.75v-2.5a.75.75 0 011.5 0v2.5a.75.75 0 01-.75.75zm3.75 0a.75.75 0 01-.75-.75v-5a.75.75 0 011.5 0v5a.75.75 0 01-.75.75zm3.75 0A.75.75 0 0110.5 12v-7.5a.75.75 0 011.5 0V12a.75.75 0 01-.75.75zm3.75 0a.75.75 0 01-.75-.75V6.75a.75.75 0 011.5 0v6a.75.75 0 01-.75.75z" />
    </svg>
);