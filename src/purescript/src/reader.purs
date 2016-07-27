module Reader where

import Node.Path
import Data.Map
import Data.Tuple hiding (lookup)

data Value = VI Int | VN Number | VS String

type DataTable = Map (Tuple String Int) Value

type ReaderFunc = Array (Array String) -> DataTable

type DataSet = {folder::FilePath, google_sheet:: String, reader :: ReaderFunc}

exp20151111 = {
        name: "/Users/hiroyuki/Google Drive/ExpData/Force gauge/20151111-2 PLA MNs flexible patch adhesion on skin",
        google_sheet: "https://docs.google.com/spreadsheets/d/1m-GlKGr9ZXVXEhRm8yFvrGvZJXmMla6LbqhCUccaQNo/edit#gid=0",
        reader: read_force
    }

read_force :: ReaderFunc
read_force rows =
    let
        d = insert (Tuple "name" 1) (VI 2) empty
    in
        lookup (Tuple "name" 1) d

type Preset = {sheet :: String, folder :: String, analysis :: String, condition_kinds: Array String}

getProjectPresets :: String -> Preset
getProjectPresets key = key

rootFolder = "/Volumes/MacintoshHD/Google Drive/"

projectPresets :: Preset
projectPresets = {
                sheet: "https://docs.google.com/spreadsheets/d/1wMwgsEgro9ddiT4y1Xcab_WWTrWi8-vT-4AHt-TwaXc/edit#gid=337733766",
                folder: rootFolder ++ "ExpData/Digital microscope/20151102 PLA MNs heat processing",
                analysis: "microscope",
                condition_kinds: ["sample", "tilt"]
            }
        --                 '1111-2 PLA MNs of 1110': {
        --         sheet: 'https://docs.google.com/spreadsheets/d/1m-GlKGr9ZXVXEhRm8yFvrGvZJXmMla6LbqhCUccaQNo/edit#gid=408219997',
        --         folder: rootFolder + 'ExpData/Digital microscope/20151111-2 PLA MNs of 1110',
        --         analysis: 'microscope',
        --         condition_kinds: ['sample', 'tilt']
        --     },
        --     '1113-2 GMA MNs water absorption': {
        --         sheet: 'https://docs.google.com/spreadsheets/d/1Zfw5aq74GqDR1Oho25IbBQhgeQFtCbyWM969LQhr6oo/edit#gid=0',
        --         folder: rootFolder + 'ExpData/Digital microscope/20151113-2 GMA MNs water absorption movies small',
        --         analysis: 'video',
        --         extensions: ['avi', 'mpg'],
        --         condition_kinds: ['sample']
        --     },
        --     '1116 Liu PDMS mold': {
        --         sheet: 'https://docs.google.com/spreadsheets/d/12p7elzxoc-iTPe-aZNu61iJnyqchEfA48uaB2bb0FO4/edit#gid=0',
        --         folder: rootFolder + 'ExpData/Digital microscope/20151116 Liu PDMS male mold',
        --         analysis: 'microscope',
        --         condition_kinds: ['sample', 'tilt']
        --     }
        -- };
