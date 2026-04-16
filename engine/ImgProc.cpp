
#include <iostream>
#include <fstream>
#include <vector>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <cmath>

//------------------------ Global variables---------------------------------//
std::vector<int> low;
std::vector<int> numberdetected;
std::vector<std::vector<int>> CollectData; // 2D vector to collect the data.
std::ofstream out("output.txt");
std::vector<unsigned char> data;
int FrontVal, BackVal;
int w, h, maxv, valscr;
int loopp;
int cc = 0;
int ccc = 0;
bool onetimecheck = true;
std::vector<std::vector<std::vector<int>>> templateNum;
double finalnum = 0;
// ----------------------------------------------------------------------- //

//--------------------Function declarations--------------------------------//
void Hist();
void printofile(int w);
void processdata(std::vector<int> sumzero, int firstY, int lastY);
std::vector<std::vector<int>> Resize(std::vector<std::vector<int>> img, int newWidth, int newHeight);
void TemplateNumber();
void Matching(std::vector<std::vector<int>> img);
// ----------------------------------------------------------------------- //


// int main()
// {   

extern "C" {
    void myrun(unsigned char* input, int width, int height) {

        low.clear();
        numberdetected.clear();
        data.clear();
        finalnum = 0;
        onetimecheck = true;

        // ตั้งค่า
        w = width;
        h = height;
        maxv = 255;

        data.clear();
        data.resize(w * h);

        // copy data จาก JS
        for (int i = 0; i < w * h; i++) {
            data[i] = input[i];
        }

        TemplateNumber();
        // std::ifstream f("/Users/wutipong/Desktop/Project/1-9/binary/7.pgm", std::ios::binary);
        // std::ifstream f("/Users/wutipong/Desktop/Project/output7.pgm", std::ios::binary);

        // std::string magic;

        // // อ่าน header
        // f >> magic >> w >> h >> maxv;
        // f.get(); // Avoiding newline

        // // อ่าน pixel
        // data.resize(w * h);
        std::vector<int> sumzero;
        // f.read((char *)data.data(), data.size());

        // // แสดงข้อมูล
        // std::cout << "W=" << w << " H=" << h << "\n";
        // std::cout << "First 10 pixels:\n";


        //------------------Collecting low rows--------------------------------

        // Collecting the values that have number of zero pixel between 50 to less than 50% of width.
        valscr = w * 0.5; // 50% of width.
        for (int y = 0; y < h; y++)
        {
            int count = 0;
            for (int x = 0; x < w; x++)
            {
                if (data[y * w + x] == 0)
                {
                    count++;
                }
            }
            if (count > 10 && count < valscr)
            {
                // out << y << " " << count << "\n";
                low.push_back(y);
            }
        }

        // Finding sum of number of zero pixel in each column
        for (int y = 0; y < low.size(); y++)
        {
            for (int x = 0; x < w; x++)
            {
                if (y == 0)
                {
                    int v = data[low[y] * w + x];
                    if (v == 255)
                    {
                        sumzero.push_back(0);
                    }
                    else
                    { // Finding sum of number of zero pixel in each column
                        sumzero.push_back(1);
                    }
                }
                else
                {
                    int v = data[low[y] * w + x];
                    if (v == 255)
                    {
                        sumzero[x] += 0;
                    }
                    else
                    {
                        sumzero[x] += 1;
                    }
                }
            }
        }

        //---------------------------------------------------------------------

        //------------------Borderless image screening.------------------------
        int samplesize = 30; // Number of samples
        float xbarF, xbarB;
        float currentval, cvF, cvB;
        float stddevF = 0, stddevB = 0;

        // Front coefficient of variation(cvF) calculation
        xbarF = 0;
        for (int i = 0; i < samplesize; i++)
        {
            xbarF += sumzero[i];
        }
        xbarF = xbarF / samplesize;
        if (xbarF != 0)
        {
            for (int i = 0; i < samplesize; i++)
            {
                currentval = (sumzero[i] - xbarF) * (sumzero[i] - xbarF);
                stddevF = stddevF + currentval;
            }
            stddevF = stddevF / (samplesize - 1);
            stddevF = std::sqrt(stddevF);
            cvF = (stddevF / xbarF) * 100;
        }
        else
        {
            cvF = 0;
        }

        // Back coefficient of variation(cvB) calculation
        xbarB = 0;
        for (int i = sumzero.size() - 1; i > (sumzero.size() - samplesize - 1); i--)
        {
            xbarB += sumzero[i];
        }
        xbarB = xbarB / samplesize;
        if (xbarB != 0)
        {
            for (int i = sumzero.size() - 1; i > (sumzero.size() - samplesize - 1); i--)
            {
                currentval = (sumzero[i] - xbarB) * (sumzero[i] - xbarB);
                stddevB = stddevB + currentval;
            }
            stddevB = stddevB / (samplesize - 1);
            stddevB = std::sqrt(stddevB);
            cvB = (stddevB / xbarB) * 100;
        }
        else
        {
            cvB = 0;
        }

        // Finding FrontVal and BackVal
        FrontVal = 0;
        BackVal = 0;
        float sumval = 0;
        float previousval = 0;
        xbarF = 0;
        xbarB = 0;
        float calval;
        if (cvF <= 10 && cvB <= 10)
        {
            if (cvF == 0 && cvB == 0)
            {
                // FrontVal
                for (int i = 0; i < sumzero.size() - 1; i++)
                {
                    if (sumzero[i] != 0)
                    {
                        FrontVal = i;
                        break;
                    }
                }
                // BackVal
                for (int i = sumzero.size() - 1; i > 0; i--)
                {
                    if (sumzero[i] != 0)
                    {
                        BackVal = i;
                        break;
                    }
                }
            }
            else
            {
                // FrontVal
                for (int i = 0; i < sumzero.size() - 1; i++)
                {
                    if (i < samplesize)
                    {
                        sumval += sumzero[i];
                        xbarF = sumval / (i + 1);
                        previousval = xbarF;
                    }
                    else
                    {
                        sumval += sumzero[i];
                        xbarF = sumval / (i + 1);
                        if (xbarF < previousval)
                        {
                            calval = 100 - ((xbarF / previousval) * 100);
                            if (calval > 0.9)
                            {
                                FrontVal = i + 1;
                                break;
                            }
                            else
                            {
                                previousval = xbarF;
                            }
                        }
                        else
                        {
                            previousval = xbarF;
                        }
                    }
                }
                // Backval
                sumval = 0;
                int counter = 1;
                for (int i = sumzero.size() - 1; i > 0; i--)
                {
                    if (i > sumzero.size() - samplesize - 1)
                    {
                        sumval += sumzero[i];
                        xbarB = sumval / counter;
                        previousval = xbarB;
                    }
                    else
                    {
                        sumval += sumzero[i];
                        xbarB = sumval / counter;
                        if (xbarB < previousval)
                        {
                            calval = 100 - ((xbarB / previousval) * 100);
                            if (calval > 0.9)
                            {
                                BackVal = i + 1;
                                break;
                            }
                            else
                            {
                                previousval = xbarB;
                            }
                        }
                        else
                        {
                            previousval = xbarB;
                        }
                    }
                    counter++;
                }
            }
        }

        if (FrontVal != 0 && BackVal != 0)
        {
            std::vector<int>().swap(low); // clear the vector and set the capacity to 0
            for (int y = 0; y < h; y++)
            {
                int count = 0;
                for (int x = FrontVal; x <= BackVal; x++)
                {
                    if (data[y * w + x] == 0)
                    {
                        count++;
                    }
                }
                if (count > 50 && count < valscr)
                {
                    // out << y << " " << count << "\n";
                    low.push_back(y);
                }
            }
        }

        //--------------------------------------------------------------------

        std::vector<int>().swap(sumzero);

        if (low.empty()) return;

        int seq = low[0] - 1;
        int count, firstY;
        bool cont = true;
        if (FrontVal == 0 && BackVal == 0)
        { // When the image is borderless, we will process all columns.
            FrontVal = 0;
            BackVal = w - 1;
        }

        for (int y = 0; y < low.size(); y++)
        {
            count = 0;
            if (low[y] - seq == 1)
            {
                for (int x = FrontVal; x <= BackVal; x++)
                {
                    if (cont == true)
                    {
                        firstY = y;
                        int v = data[low[y] * w + x];
                        if (v == 255)
                        {
                            sumzero.push_back(0);
                            // out << 1 << " ";
                        }
                        else
                        { // Finding sum of number of zero pixel in each column
                            sumzero.push_back(1);
                            // out << v << " ";
                        }
                        count++;
                    }
                    else
                    {
                        int v = data[low[y] * w + x];
                        if (v == 255)
                        {
                            sumzero[count] += 0;
                            // out << 1 << " ";
                        }
                        else
                        {
                            sumzero[count] += 1;
                            // out << v << " ";
                        }
                        count++;
                    }
                }
                cont = false;
                // out << "\n";
            }
            else
            {

                if (low[y - 1] - low[firstY] >= 14)
                {
                    // if (loopp == 9)
                    // {
                        processdata(sumzero, low[firstY], low[y - 1]);
                    // }
                    // loopp++;
                }

                // std::cout << "----------------------------------------" << "\n";

                sumzero.clear();
                cont = true;
                // out << "\n";
                // out << "\n";

                for (int x = FrontVal; x <= BackVal; x++)
                {
                    if (cont == true)
                    {
                        firstY = y;
                        int v = data[low[y] * w + x];
                        if (v == 255)
                        {
                            sumzero.push_back(0);
                            // out << 1 << " ";
                        }
                        else
                        { // Finding sum of number of zero pixel in each column
                            sumzero.push_back(1);
                            // out << v << " ";
                        }
                        count++;
                    }
                    else
                    {
                        int v = data[low[y] * w + x];
                        if (v == 255)
                        {
                            sumzero[count] += 0;
                            // out << 1 << " ";
                        }
                        else
                        {
                            sumzero[count] += 1;
                            // out << v << " ";
                        }
                        count++;
                    }
                }
                cont = false;
                // out << "\n";
            }
            seq = low[y]; // collect old value to compare with next value.
        }


        //--------------------result output--------------------------

        // for (int i = 0; i < numberdetected.size(); i++)
        // {
        //     std::cout << numberdetected[i] << "\n";
        // }
        
        int power = -2;
        double prevnum = 0;
        for (int i = 0; i < numberdetected.size(); i++){
            prevnum = numberdetected[i] * pow(10,power + i);
            finalnum = finalnum + prevnum;
            prevnum = 0;
        }

        // std::cout << finalnum << "\n";
        //---------------------End section---------------------
        // Time stamp
        auto now = std::chrono::system_clock::now();
        std::time_t t = std::chrono::system_clock::to_time_t(now);
        std::cout << "Program completed: " << std::put_time(std::localtime(&t), "%H:%M:%S") << "\n";
        // Hist();
        // printofile(w);
        return;
    }
    
    double get_final() {
        return finalnum;
    }
}



void Hist()
{
    std::ifstream in("output.txt");
    int hist[256] = {0};

    int v;
    while (in >> v)
    {
        if (v >= 0 && v <= 255)
            hist[v]++;
    }

    std::ofstream out("hist.txt");
    for (int i = 0; i < 256; i++)
    {
        out << i << " " << hist[i] << "\n";
    }

    std::cout << "done: hist.txt\n";
}

void printofile(int w)
{
    if (FrontVal == 0 && BackVal == 0)
    {
        for (int y = 0; y < low.size(); y++)
        {
            for (int x = 0; x < w; x++)
            {
                int v = data[low[y] * w + x];
                if (v == 255)
                {
                    out << 1 << " ";
                }
                else
                {
                    out << v << " ";
                }
            }
            out << "\n";
        }
    }
    else
    {
        for (int y = 0; y < low.size(); y++)
        {
            for (int x = FrontVal; x <= BackVal; x++)
            {
                int v = data[low[y] * w + x];
                if (v == 255)
                {
                    out << 1 << " ";
                }
                else
                {
                    out << v << " ";
                }
            }
            out << "\n";
        }
    }
}

void processdata(std::vector<int> sumzero, int firstY, int lastY)
{
    // if (loopp == 6){
    // //if (lastY - firstY >= 14){ //screening the image that has more than or equal to 14 rows. These rows should be noise.
    //     //Output sumzero to output.txt
    // for (int i = FrontVal; i <= BackVal; i++){
    //     //out << sumzero[i] << "\n";
    //     out << i << " " << sumzero[cc] << "\n";
    //     cc++;
    // }
    // //}
    // }
    // loopp++;

    // for (int y = firstY; y <= lastY; y++){
    //     for(int x = FrontVal; x <= BackVal; x++){
    //         int v = data[y * w + x];
    //         if (v==255){
    //             out << 1 << " ";
    //         }
    //         else{
    //             out << 0 << " ";
    //         }
    //     }
    //     out << "\n";
    // }
    // out << "\n";
    // out << "\n";

    int count = 0;
    int count1 = 0;
    int countSpace = 0;
    int MaxX = 0;
    int FrontX = 0;
    int BackX = 0;
    int countloop = 0;
    bool FirstVal= true;
    bool ContCheck = false; 
    bool FirstCheck = false;
    std::vector<int> spacing;
    std::vector<std::vector<int>> tempo;
    std::vector<std::vector<int>> TempoArrign;
    std::vector<int> New;
    std::vector<int> newsum0;

    for (int i = FrontVal; i <= BackVal; i++){
        // if (sumzero[countloop] != 0){
        if (sumzero[countloop] > 1){
            count++;
            //Sreening the noise
            if (count < 3){
                if (FirstVal == true){
                    FrontX = i;
                    FirstVal = false;
                }

                // if (sumzero[countloop+1] == 0){ 
                if (sumzero[countloop+1] <= 1){ 
                    count = 0;
                    FirstVal = true;
                }
                // else if (sumzero[countloop+2] == 0){
                else if (sumzero[countloop+2] <= 1){
                    count = 0;
                    FirstVal = true;
                }
                // else if (sumzero[countloop+3] == 0){
                //     count = 0;
                //     FirstVal = true;
                // }
            }
            else if(count == 3){
                // if (sumzero[countloop+1] == 0){ 
                if (sumzero[countloop+1] <= 1){ 
                    count = 0;
                    FirstVal = true;
                }
            }
        }

        if (count > 3){

            if (MaxX < count){
                MaxX = count;
            }
            
            // if (sumzero[countloop] == 0){
            if (sumzero[countloop] <= 1){
                //std::cout << FrontX << "\n";
                //std::cout << i-1 << "\n";
                // std::cout << count << "\n";
                ContCheck = true;
                count = 0;
                BackX = i - 1;
            }
        }
        if (ContCheck == true){
            // if (sumzero[countloop] == 0){
            if (sumzero[countloop] <= 1){
                countSpace++;
            }
            // if (sumzero[countloop+1] != 0){
            if (sumzero[countloop+1] > 1){
                // if (FirstCheck == false){
                ContCheck = false;
                spacing.push_back(countSpace);
                FirstCheck = true;
                countSpace = 0; 
                // }
            }
            else if (countSpace > 20){
                ContCheck = false;
                FirstCheck = true;
                countSpace = 0;
                if (count1 == 0){
                    tempo.push_back({FrontX, BackX, firstY, lastY, count1, MaxX});
                    MaxX = 0;
                }
                else{
                    tempo.push_back({FrontX, BackX, firstY, lastY, count1+1, MaxX});
                    MaxX = 0;
                    count1 = 0;
                }
                FirstVal = true;
            }
        }
        if (spacing.size() > 1){
            if (spacing[1] < (spacing[0]+9)) {
                spacing.erase(spacing.begin()+1);
                count1++;
            }
            else{
                tempo.push_back({FrontX, BackX, firstY, lastY, count1+1, MaxX});
                MaxX = 0;
                count1 = 0;
                FirstVal = true;
                std::vector<int>().swap(spacing);
            }
        }
        countloop++;
    }
    //------------------------------------------------------------------------------
    // Judgement section!!
    //Tempo({Front x(0), back x(1), front y(2), back y(3), number of space(4), Max X count(5)}) 

    for (int i =0; i < tempo.size(); i++){
        // if (FrontVal == tempo[i][0]){
        //     tempo.erase(tempo.begin() + i);
        // }
        if (BackVal == tempo[i][1]){
            tempo.erase(tempo.begin() + i);
        }
        else if (tempo[i][4] == 0){ //removing if no space.
            tempo.erase(tempo.begin() + i);
        }
        // else if (tempo[i][5] > 50){
        //     if (tempo.size() > 1){

        //     }
        //     tempo.erase(tempo.begin() + i);
        // }
    }

    // for (int z = tempo[0][2]; z <= tempo[0][3]; z++){
    //     for(int r = tempo[0][0]; r <= tempo[0][1]; r++){
    //         int v = data[z * w + r];
    //         if (v==255){
    //             out << 1 << " ";
    //         }
    //         else{
    //             out << 0 << " ";
    //         }
    //     }
    //     out << "\n";
    // }
    // out << "\n";

    ContCheck = false;
    if (tempo.size() != 0){
        for (int i = 0; i < tempo.size(); i++){
            ContCheck = false;
            for (int y = tempo[i][2]; y <= tempo[i][3]; y++){
                int counting = 0;
                for (int x = tempo[i][0]; x <= tempo[i][1]; x++)
                {
                    if (data[y * w + x] == 0)
                    {
                        counting++;
                    }
                }
                // std::cout << counting << "\n";
                // if (counting > 3){
                // // if (counting != 0){
                //     New.push_back(y);
                // }
                if (ContCheck == true)
                {
                    if ((counting == 0) || (y == tempo[i][3]))
                    {
                        New.push_back(y);
                        ContCheck = false;
                    }
                }
                else{
                    if (counting != 0)
                    {
                        New.push_back(y);
                        ContCheck = true;
                    }
                }

                // if (New.size() > 1){
                //     for (int z = New[0]; z <= New[1]; z++){
                //         for(int r = tempo[i][0]; r <= tempo[i][1]; r++){
                //             int v = data[z * w + r];
                //             if (v==255){
                //                 out << 1 << " ";
                //             }
                //             else{
                //                 out << 0 << " ";
                //             }
                //         }
                //         out << "\n";
                //     }
                //     out << "\n";
                // }
                
                if (New.size() > 1)
                {
                    if (New[New.size() - 1] - (New[0]) >= 5)
                    {
                        for (int yy = New[0]; yy <= New[1]; yy++)
                        {
                            cc = 0;
                            for (int xx = tempo[i][0]; xx < tempo[i][1]; xx++)
                            {
                                if (yy == New[0])
                                {
                                    int v = data[yy * w + xx];
                                    if (v == 255)
                                    {
                                        newsum0.push_back(0);
                                    }
                                    else
                                    { // Finding sum of number of zero pixel in each column
                                        newsum0.push_back(1);
                                    }
                                }
                                else
                                {
                                    int v = data[yy * w + xx];
                                    if (v == 255)
                                    {
                                        newsum0[cc] += 0;
                                    }
                                    else
                                    {
                                        newsum0[cc] += 1;
                                    }
                                    cc++;
                                }
                            }
                        }
                        cc = 0;
                        int fn = 0;
                        for (int lp = tempo[i][0]; lp <= tempo[i][1];lp++){
                            if (newsum0[cc] != 0){
                                fn = lp;
                                break;
                            }
                            cc++;
                        }
                        int ln = 0;
                        cc = newsum0.size() - 1;
                        for (int lp = tempo[i][1]; lp >= tempo[i][0];lp--){
                            if (newsum0[cc] != 0){
                                ln = lp;
                                break;
                            }
                            cc--;
                        }
                        TempoArrign.push_back({fn, ln, New[0], New[1]});
                    }

                    // if (TempoArrign.size() != 0){
                    //     for (int z = TempoArrign[i][2]; z <= TempoArrign[i][3]; z++){
                    //         for(int r = TempoArrign[i][0]; r <= TempoArrign[i][1]; r++){
                    //             int v = data[z * w + r];
                    //             if (v==255){
                    //                 out << 1 << " ";
                    //             }
                    //             else{
                    //                 out << 0 << " ";
                    //             }
                    //         }
                    //         out << "\n";
                    //     }
                    //     out << "\n";
                    // }

                    std::vector<int>().swap(New);
                    std::vector<int>().swap(newsum0);
                }
            }

            // for (int lp = 0; lp < TempoArrign.size(); lp++){
            //     for (int y = TempoArrign[lp][2]; y <= TempoArrign[lp][3]; y++){
            //         for(int x = TempoArrign[lp][0]; x <= TempoArrign[lp][1]; x++){
            //             int v = data[y * w + x];
            //             if (v==255){
            //                 out << 1 << " ";
            //             }
            //             else{
            //                 out << 0 << " ";
            //             }
            //         }
            //         out << "\n";
            //     }
            //     out << "\n";
            // }

        }

        std::vector<std::vector<int>>().swap(tempo);
        std::vector<int>().swap(newsum0);
        tempo = TempoArrign;

        for (int i = 0; i < tempo.size(); i++){
            int firstloop = 0;
            for (int y = tempo[i][2]; y <= tempo[i][3]; y++){
                cc = 0;
                for(int x = tempo[i][0]; x <= tempo[i][1]; x++){
                    if (firstloop == 0){
                        int v = data[y * w + x];
                        if (v==255){
                            New.push_back(0);
                        }
                        else{ //Finding sum of number of zero pixel in each column
                            New.push_back(1);
                        }
                    }
                    else{
                        int v = data[y * w + x];
                        if (v==255){
                            New[cc] += 0;
                        }
                        else{
                            New[cc] += 1;
                        }
                    }
                    cc++;
                }
                firstloop++;
            }
            ContCheck = false;
            int counting = 0;
            int prv = 100000000;
            int sp = 0;
            // if (i == 3){
                for (int x = tempo[i][0]; x <= tempo[i][1]; x++){
                    if (New[sp] == 0){
                        counting++;
                    }
                    else{
                        if (counting > 0){
                            // std::cout << "----------------------------------------??????" << "\n";
                            // std::cout << counting << "\n";
                            // std::cout << "----------------------------------------??????" << "\n";
                            if (counting > prv + 5){
                                // std::cout << x << "\n";
                                // prv = 100000000;
                                int bkX = tempo[i][1];
                                tempo[i][1] = x - counting - 1;
                                tempo.push_back({x, bkX, tempo[i][2], tempo[i][3]});
                                break;
                            }
                            prv = counting;
                            counting = 0;
                        }
                    }
                    // out << x << " " << New[sp] << "\n";
                    sp++;
                }
            // }

            std::vector<int> result;
            cc = 0;
            int cc2 = 0;
            bool checking = true;
            double countcal = 0;
            // double prev = 1;
            double result1;
            double high = tempo[i][3]-tempo[i][2];
            for (int x = tempo[i][0]; x <= tempo[i][1]; x++){
                //out << sumzero[i] << "\n";
                //out << x << " " << New[cc] << "\n";
                cc++;
                if (high < 80){
                    if (New[cc] <= 1){
                        if (checking == false){
                            result.push_back((100 / high) * countcal);
                            result1 = (100 / high) * countcal;
                            // std::cout << result1 << "\n";
                            countcal = 0;
                            checking = true;
                        }
                    }
                    else{
                        if (New[cc] > countcal){
                            countcal = New[cc];
                        }
                        checking = false;
                    }
                }
            }
            //std::cout << "----------------------------------------" << "\n";

            if (onetimecheck == true){
                if (result.size() > 3 && result.size() < 11){
                    if (result[result.size() - 1] > 45){
                        if (result[result.size() - 3] <= 22){

                            // for (int z = tempo[i][2] + 1; z < tempo[i][3]; z++){
                            //     for(int t = tempo[i][0]; t <= tempo[i][1]; t++){
                            //         int v = data[z * w + t];
                            //         if (v==255){
                            //             out << 1 << " ";
                            //         }
                            //         else{
                            //             out << 0 << " ";
                            //         }
                            //     }
                            //     out << "\n";
                            // }
                            // out << "\n";
                            // out << "\n";
                            // for (int i = 0; i < result.size();i++){
                            //     std::cout << result[i] << "\n";
                            // }

                            // ----------------------------End-----------------------------------

                            //New sumzero for each column in the character box.
                            bool first = true;
                            for (int z = tempo[i][2] + 1; z < tempo[i][3]; z++){
                                cc2 = 0;
                                for(int t = tempo[i][1]; t >= tempo[i][0]; t--){
                                    if (first == true){
                                        int v = data[z * w + t];
                                        if (v==255){
                                            newsum0.push_back(0);
                                        }
                                        else{
                                            newsum0.push_back(1);
                                        }
                                    }
                                    else{
                                        int v = data[z * w + t];
                                        if (v==255){
                                            newsum0[cc2] += 0;
                                        }
                                        else{
                                            newsum0[cc2] += 1;
                                        }
                                        cc2++;
                                    }
                                }
                                first = false;
                            }
                            // for (int ii = 0; ii < newsum0.size();ii++){
                            //     // std::cout << newsum0[ii] << "\n";
                            //     out << newsum0[ii] << "\n";
                            // }
                            
                            std::vector<std::vector<int>> img(tempo[i][3]-(tempo[i][2] + 1));
                            int tempox = tempo[i][1];
                            first = true;
                            bool check0 = true;
                            bool check1 = true;
                            int avoiddot = 0;

                            for (int z = 0;z < newsum0.size(); z++){
                                if (newsum0[z] != 0){
                                    cc2 = 0;
                                    if (avoiddot != 2){
                                        for (int t = tempo[i][2] + 1; t < tempo[i][3]; t++){
                                            int v = data[t * w + tempox];
                                            if (first == true){
                                                if (v==255){
                                                    img[cc2].push_back(1);
                                                }
                                                else{
                                                    img[cc2].push_back(0);
                                                }
                                            }
                                            else{
                                                if (v==255){
                                                    img[cc2].insert(img[cc2].begin(), 1);
                                                }
                                                else{
                                                    img[cc2].insert(img[cc2].begin(), 0);
                                                }
                                            }
                                            cc2++;
                                        }
                                        first = false;
                                        check0 = true;
                                    }

                                    if (newsum0[z+1] == 0){
                                        check1 = true;
                                    }
                                }
                                if ((newsum0[z] == 0) || (z == newsum0.size() - 1)){
                                    if (avoiddot != 2){
                                        if (check0 == true){
                                            img = Resize(img,10,10);
                                            
                                            //------------------Debug--------------------------
                                            // for (int zz = 0; zz < img.size(); zz++){
                                            //     for (int tt = 0; tt < img[zz].size(); tt++){
                                            //         out << img[zz][tt] << " ";
                                            //     }
                                            //     out << "\n";
                                            // }
                                            // out << "\n";
                                            // out << "\n";
                                            //-------------------------------------------------

                                            Matching(img);

                                            first = true;
                                            check0 = false;
                                            std::vector<std::vector<int>>().swap(img);
                                            img.resize(tempo[i][3] - (tempo[i][2] + 1));
                                            // break;
                                        }
                                    }
                                    if (check1 == true){
                                        check1 = false;
                                        avoiddot++;
                                    }
                                }
                                tempox--;
                            }
                            onetimecheck = false;
                        }
                    }
                } 
            }
            std::vector<int>().swap(New);
            std::vector<int>().swap(result);
        }
    }
}

std::vector<std::vector<int>> Resize(std::vector<std::vector<int>> img, int newWidth, int newHeight){
    std::vector<std::vector<int>> resized(newHeight, std::vector<int>(newWidth));
    int oldHeight = img.size();
    int oldWidth = img[0].size();

    for (int i = 0; i < newHeight; i++){
        for (int j = 0; j < newWidth; j++){
            int oldX = j * oldWidth / newWidth;
            int oldY = i * oldHeight / newHeight;
            resized[i][j] = img[oldY][oldX];
        }
    }
    return resized;

}

void TemplateNumber(){
    std::vector<std::vector<int>> zero = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,1,0,0,1,1,0,0,0,1},
        {1,0,0,1,1,1,1,1,0,0},
        {0,0,0,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,1,0,0,0,1,0,0,0,1}
    };

    std::vector<std::vector<int>> one = {
        {1,1,1,1,0,0,0,0,0,0},
        {0,0,0,0,0,0,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0}
    };

    std::vector<std::vector<int>> two = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,0,0,0,1,1,1,0,0,0},
        {1,0,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,0,0,1},
        {1,1,1,1,1,0,0,0,1,1},
        {1,1,1,1,0,0,0,1,1,1},
        {1,1,0,0,0,1,1,1,1,1},
        {1,0,0,0,0,0,0,0,0,0}
    };

    std::vector<std::vector<int>> three = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,0,0,0,1,1,1,0,0,1},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,0,0,0,1},
        {1,1,1,1,0,0,0,0,0,1},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,0,1,1,1,1,1,1,0,0},
        {1,0,0,0,0,1,0,0,0,0}
    };

    std::vector<std::vector<int>> four = {
        {1,1,1,1,1,1,1,0,1,1},
        {1,1,1,1,1,1,0,0,0,1},
        {1,1,1,1,1,0,0,0,0,1},
        {1,1,1,1,0,0,1,0,0,1},
        {1,1,1,0,0,1,1,0,0,1},
        {1,1,0,0,1,1,1,0,0,1},
        {1,0,0,1,1,1,1,0,0,1},
        {0,0,0,0,0,0,0,0,0,0},
        {1,1,1,1,1,1,1,0,0,1},
        {1,1,1,1,1,1,1,0,0,1}
    };

    std::vector<std::vector<int>> five = {
        {1,0,0,0,0,0,0,0,0,1},
        {1,0,0,0,1,1,1,1,1,1},
        {1,0,0,1,1,1,1,1,1,1},
        {1,0,0,1,1,1,1,1,1,1},
        {1,0,0,0,0,0,0,0,1,1},
        {1,0,1,1,1,1,1,0,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,0,1,1,1,1,1,1,0,0},
        {0,0,0,0,1,0,0,0,0,1}
    };

    std::vector<std::vector<int>> six = {
        {1,1,1,1,0,0,0,0,0,1},
        {1,1,0,0,0,1,1,1,0,0},
        {1,0,0,1,1,1,1,1,1,1},
        {0,0,0,1,1,1,1,1,1,1},
        {0,0,1,1,0,0,0,0,0,1},
        {0,0,0,0,1,1,1,0,0,0},
        {0,0,0,1,1,1,1,1,1,0},
        {0,0,1,1,1,1,1,1,1,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,1,0,0,0,1,0,0,0,0}
    };

    std::vector<std::vector<int>> seven = {
        {0,0,0,0,0,0,0,0,0,0},
        {1,0,1,1,0,1,0,0,0,0},
        {1,1,1,1,1,1,1,0,0,0},
        {1,1,1,1,1,1,1,0,0,1},
        {1,1,1,1,1,1,0,0,1,1},
        {1,1,1,1,1,0,0,0,1,1},
        {1,1,1,1,0,0,0,1,1,1},
        {1,1,1,1,0,0,1,1,1,1},
        {1,1,1,0,0,1,1,1,1,1},
        {1,1,0,0,0,1,1,1,1,1}
    };

    std::vector<std::vector<int>> eight = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,0,0,0,1,1,1,0,0,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,1,0,0,0,1,0,0,0,1},
        {1,1,0,0,0,0,0,0,0,1},
        {1,0,0,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {0,0,0,1,1,1,1,1,0,0},
        {1,0,0,0,1,1,0,0,0,0}
    };

    std::vector<std::vector<int>> nine = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,0,0,0,1,1,0,0,0,1},
        {0,0,0,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {0,0,0,1,1,1,1,1,0,0},
        {1,0,0,0,1,1,0,0,0,0},
        {1,1,1,0,0,0,0,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,0,0,1},
        {1,0,0,0,0,0,0,0,0,1}
    };
    templateNum = {
        zero,
        one,
        two,
        three,
        four,
        five,
        six,
        seven,
        eight,
        nine
    };
}

void Matching(std::vector<std::vector<int>> img){
    std::vector<int> numcheck;
    int countmatch = 0;
    int screennoise = 0;

    for (int i = 0; i < templateNum.size(); i++){
        bool scr = true;
        for (int y = 0; y < templateNum[i].size(); y++){
            for (int x = 0; x < templateNum[i][y].size(); x++){
                if (img[y][x] == templateNum[i][y][x]){
                    countmatch++;
                }
                screennoise = screennoise + img[y][x];
            }
            if (screennoise == 80){
                scr = false;
                break;
            }
        }
        if (scr == true){
            numcheck.push_back(countmatch);
        }
        countmatch = 0;
        screennoise = 0;
    }

    int lastnum = -1000000;
    int number = 0;
    for (int i = 0; i < numcheck.size(); i++){
        if (numcheck[i] > lastnum){
            lastnum = numcheck[i];
            number = i;
        }
    }
    if (numcheck.size() != 0){
        numberdetected.push_back(number);
    }
}

// Output sumzero to output.txt
//  for (int i = FrontVal; i <= BackVal; i++){
//      //out << sumzero[i] << "\n";
//      out << i << " " << sumzero[i] << "\n";
//  }

// for (unsigned char v : data) {
//     std::cout << static_cast<int>(v) << " ";
// }

// for (int y = firstY; y <= lastY; y++){
//     for(int x = FrontVal; x <= BackVal; x++){
//         int v = data[y * w + x];
//         if (v==255){
//             out << 1 << " ";
//         }
//         else{
//             out << 0 << " ";
//         }
//     }
//     out << "\n";
// }
// out << "\n";
// out << "\n";